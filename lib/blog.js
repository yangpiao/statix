/**
 * Blog contents handler.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  async = require('async'),
  parser = require('./parser'),
  config = require('./config'),
  template = require('./template'),
  utils = require('./utils');

function joinUrl(base, part) {
  var len = base.length, last = base[len - 1], first = part[0];
  if (last !== '/' && first !== '/') {
    return base + '/' + part;
  } else if (last === '/' && first === '/') {
    return base + part.substring(1);
  } else {
    return base + part;
  }
}

module.exports = {
  config: {},
  output: null,
  posts: [],
  files: [],
  postTemplate: '',
  tagTemplate: '',
  pageTemplates: {},
  siteConfig: null,
  urlRoot: null,
  urlBlog: null,

  /**
   * Loads blog sources.
   */
  load: function(opts, callback) {
    if (opts == null) {
      callback(null);
    }
    this.config = utils.mix({}, opts);
    this.pageTemplates = utils.mix(this.pageTemplates, this.config.templates);
    this.postTemplate = this.pageTemplates.post || '';
    this.tagTemplate = this.pageTemplates.tag || '';
    delete this.pageTemplates.post;
    delete this.pageTemplates.tag;
    this.siteConfig = config;
    this.urlRoot = config.urlRoot;
    this.process(this.config.directory, callback);
  },

  process: function(dir, callback) {
    var me = this;
    utils.processFiles(dir, function(file) {
      var name = file.name, path = file.path, st = file.stat;
      if (st.isFile() && parser.support(name)) {
        me.files.push({
          name: name,
          path: path,
          mtime: st.mtime // file modified time
        });
      }
    }, callback);
  },

  prepareOutput: function(output, callback) {
    var blogOutput = this.config.output;
    if (blogOutput) {
      this.urlBlog = joinUrl(this.urlRoot, blogOutput);
      blogOutput = path.join(output, blogOutput);
      this.output = blogOutput;
      // this.config.output = blogOutput;
      utils.createDir(blogOutput, callback);
    } else {
      this.output = output;
      this.urlBlog = this.urlRoot;
      // this.config.output = output;
      callback();
    }
  },

  /**
   * Renders all the posts.
   * @param output {String} Path to the output directory.
   * @param callback {Function} Callback function: `callback(err)`.
   */
  render: function(output, callback) {
    var files = this.files, posts, me = this, postsByTag = {};

    async.waterfall([
      function(next) {
        me.prepareOutput(output, next);
      },

      function(next) {
        async.map(files, function(file, fn) {
          parser.parse(file.path, function(err, post) {
            if (err) {
              fn(err);
              return;
            }
            me.procPostData(post, file);
            fn(null, post);
          });
        }, next);
      },

      function(files, next) {
        posts = me.posts = files;
        // sorts posts by time
        posts.sort(function(p1, p2) {
          return p2.time - p1.time;
        });
        posts.forEach(function(post, index) {
          post.$posts = posts;
          // permalinks for previous and next post
          if (index > 0) {
            var newer = posts[index - 1];
            post.next = {
              title: newer.title,
              permalink: newer.permalink
            };
            newer.prev = {
              title: post.title,
              permalink: post.permalink
            };
          }
          // tags
          var tags = post.tags, i, len, tag;
          if (!tags || !tags.length) {
            tag = me.config.defaultTag || 'No tag';
            if (!postsByTag[tag]) postsByTag[tag] = [];
            postsByTag[tag].push(post);
          } else {
            for (i = 0, len = tags.length; i < len; i++) {
              tag = tags[i];
              if (!postsByTag[tag]) postsByTag[tag] = [];
              postsByTag[tag].push(post);
            }
          }
        });
        me.postsByTag = postsByTag;
        me.tags = Object.keys(postsByTag).sort();

        // renders each post
        async.each(posts, function(post, fn) {
          var tpl = template.get(post.template);
          post.$tags = me.tags;
          if (tpl) {
            tpl.render(post, function(err, html) {
              if (err) return fn(err);
              me.generatePath(path.dirname(post.outputPath), function(err) {
                if (err) return fn(err);
                fs.writeFile(post.outputPath, html, fn);
              });
            });
          } else {
            console.error('[skip] Cannot find template ' + post.template);
            fn(); // does not interrupt rendering process
          }
        }, next);
      },

      function(next) {
        me.renderTags(next);
      },

      function(next) {
        me.renderPages(next);
      }
    ], callback);
  },

  /**
   * Renders other pages, templates specified in config.yml.
   */
  renderPages: function(callback) {
    var output = this.output,
      templates = this.pageTemplates, key, tpls = [],
      pagination = this.config.pagination,
      posts = this.posts,
      data = {
        $config: this.siteConfig,
        $tags: this.tags,
        $posts: posts,
        $postsByTag: this.postsByTag
      },
      me = this;

    for (key in templates) {
      tpls.push({
        page: (key[key.length - 1] === '/') ? key + 'index' : key,
        name: templates[key]
      });
    }

    if (pagination) {
      var total = Math.ceil(posts.length / pagination) || 1;
      data.paginate = {
        perPage: pagination,
        total: total,
        current: 1
      };
      async.each(tpls, function(t, fn) {
        var tpl = template.get(t.name);
        if (tpl) {
          me.paginate(t.page, tpl, posts, data, fn);
        } else {
          console.error('[skip] Cannot find template ' + t.name);
          fn();
        }
      }, function(err) {
        if (err) callback(err);
        else {
          callback(null, data);
        }
      });
    } else {
      data.posts = posts;
      async.each(tpls, function(t, fn) {
        var tpl = template.get(t.name);
        if (tpl) {
          tpl.render(data, function(err, html) {
            if (err) return fn(err);
            fs.writeFile(path.join(output, t.page) + '.html', html, fn);
          });
        } else {
          console.error('[skip] Cannot find template ' + t.name);
          fn();
        }
      }, function(err) {
        if (err) callback(err);
        else {
          callback(null, data);
        }
      });
    }
  },

  /**
   * Renders tags' pages.
   */
  renderTags: function(callback) {
    var tplName = this.tagTemplate;
    if (!tplName) {
      callback();
      return;
    }
    var tpl = template.get(tplName);
    if (!tpl) {
      console.warn('[skip] Cannot find template ' + tplName);
      callback();
      return;
    }

    var output = this.output, me = this;
    this.generatePath(path.join(output, 'tags'), function(err) {
      if (err) {
        callback(err);
        return;
      }
      async.each(me.tags, function(tag, fn) {
        var data = {
          $config: me.siteConfig,
          $tags: me.tags,
          $posts: me.posts,
          $postsByTag: me.postsByTag,
          tag: tag
        };
        me.renderTag(tag, tpl, data, fn);
      }, callback);
    });
  },

  renderTag: function(tag, tpl, data, callback) {
    var output = this.output,
      pagination = this.config.pagination,
      posts = data.$postsByTag[tag],
      pageName = 'tags/' + tag,
      me = this;

    if (pagination) {
      var total = Math.ceil(posts.length / pagination) || 1;
      data.paginate = {
        perPage: pagination,
        total: total,
        current: 1
      };
      me.paginate(pageName, tpl, posts, data, callback);
    } else {
      data.posts = posts;
      tpl.render(data, function(err, html) {
        if (err) return callback(err);
        fs.writeFile(path.join(output, pageName) + '.html', html, callback);
      });
    }
  },

  /**
   * Renders with pagination.
   */
  paginate: function(pageName, tpl, allPosts, data, callback) {
    var output = this.output, paginate = data.paginate, urlBlog = this.urlBlog,
      paths, arr, name, i,
      total = paginate.total, perPage = paginate.perPage, curr = 1;

    name = pageName + '.html';
    paginate.links = [ joinUrl(urlBlog, name) ];
    paths = [ path.join(output, name) ];
    arr = [ 0 ];
    for (i = 1; i < total; i++) {
      name = pageName + '-page-' + (i + 1) + '.html';
      paths[i] = path.join(output, name);
      paginate.links[i] = joinUrl(urlBlog, name);
      arr[i] = i;
    }
    async.each(arr, function(i, fn) {
      paginate.prevLink = paginate.links[i - 1] || null;
      paginate.nextLink = paginate.links[i + 1] || null;
      paginate.current = i + 1;
      data.posts = allPosts.slice(perPage * i, perPage * (i + 1));
      // TODO: figure out why an attr `post` was added to `data`
      tpl.render(data, function(err, html) {
        if (err) return fn(err);
        fs.writeFile(paths[i], html, fn);
      });
    }, callback);
  },

  procPostData: function(post, file) {
    post.$config = this.siteConfig;
    post.title = post.title || 'Untitled';
    if (post.time) {
      if (post.time.getTime) {
        var offset = post.time.getTimezoneOffset() * 60000;
        post.time = new Date(post.time.getTime() + offset);
      } else {
        post.time = new Date(post.time);
      }
    } else {
      post.time = file.mtime;
    }
    post.author = post.author || post.$config.author;
    if (post.tags && !Array.isArray(post.tags)) {
      post.tags = [ post.tags ];
    }
    post.template = post.template || this.postTemplate;
    post.fileData = file;
    this.parseLink(post);
  },

  parseLink: function(post) {
    var permalink = this.config.permalink,
      output = this.config.output,
      time = post.time,
      title = post.link || post.title,
      filePath, urlRoot;

    title = title.replace(/[^\w\u00C0-\u1FFF\u3040-\uD7AF]+/g, '-')
      .replace(/^-*|-*$/g, '').toLowerCase();
    permalink = permalink.replace('{year}', time.getFullYear())
      .replace('{month}', time.getMonth() + 1)
      .replace('{date}', time.getDate())
      .replace('{title}', title);

    if (this.output) {
      filePath = path.join(this.output, permalink);
    }
    if (output) {
      permalink = path.join(output, permalink);
    }
    permalink = joinUrl(this.urlRoot, permalink);
    if (!path.extname(permalink)) {
      if (permalink[permalink.length - 1] !== '/') {
        permalink += '/';
      }
      filePath = path.join(filePath, 'index.html');
    }
    post.permalink = permalink;
    post.outputPath = filePath;
  },

  generatePath: function(dirname, callback) {
    fs.exists(dirname, function(exists) {
      if (!exists) {
        utils.createDir(dirname, callback);
      } else callback();
    });
  }
};

