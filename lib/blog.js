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
    this.config = utils.mix({}, opts);
    this.pageTemplates = utils.mix(this.pageTemplates, this.config.templates);
    this.postTemplate = this.pageTemplates.post || '';
    this.tagTemplate = this.pageTemplates.tag || '';
    delete this.pageTemplates.post;
    delete this.pageTemplates.tag;
    this.siteConfig = config.current;
    this.urlRoot = config.current.urlRoot;
    this.process(this.config.directory, callback);
  },

  process: function(dir, callback) {
    var me = this;
    function processEach(file, fn) {
      var fullPath = path.join(dir, file);
      fs.stat(fullPath, function(err, st) {
        if (err) return fn(err);
        if (st.isDirectory()) {
          me.process(fullPath, fn);
        } else {
          if (st.isFile() && parser.support(file)) {
            me.posts.push({
              name: file,
              path: fullPath,
              mtime: st.mtime // file modify time
            });
          }
          fn(null);
        }
      });
    }
    fs.readdir(dir, function(err, files) {
      if (err) return callback(err);
      async.each(files, processEach, callback);
    });
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
    var posts = this.posts, me = this;
    async.waterfall([
      function(next) {
        me.prepareOutput(output, next);
      },

      function(next) {
        async.map(posts, function(post, fn) {
          parser.parse(post.path, function(err, page) {
            if (err) return fn(err);
            me.procPostData(page, post);
            fn(null, page);
          });
        }, next);
      },

      function(pages, next) {
        posts = me.posts = pages;
        // sorts posts by time
        posts.sort(function(p1, p2) {
          return p2.time - p1.time;
        });
        posts.forEach(function(post, i) {
          post.allPosts = posts;
          // permalinks for previous and next post
          if (i > 0) {
            var newer = posts[i - 1];
            post.next = {
              title: newer.title,
              permalink: newer.permalink
            };
            newer.prev = {
              title: post.title,
              permalink: post.permalink
            };
          }
        });
        // renders each post
        async.each(posts, function(post, fn) {
          var tpl = template.get(post.template);
          if (tpl) {
            tpl.render(post, function(err, html) {
              if (err) return fn(err);
              delete post.next;
              delete post.prev;
              me.generatePath(path.dirname(post.outputPath), function(err) {
                if (err) return fn(err);
                fs.writeFile(post.outputPath, html, fn);
              });
            });
          } else {
            console.error('[skip] Cannot find template ' + page.template);
            fn(); // does not interrupt rendering process
          };
        }, next);
      },

      function(next) {
        me.renderPages(next);
      }
    ], callback);
  },

  renderPosts: function(callback) {
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
        config: this.siteConfig,
        allPosts: posts
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
      data.pages = {
        perPage: pagination,
        total: total,
        current: 1
      };
      async.each(tpls, function(t, fn) {
        var tpl = template.get(t.name);
        if (tpl) {
          me.paginate(t.page, tpl, data, fn);
        } else {
          console.error('[skip] Cannot find template ' + t.name);
          fn();
        };
      }, function(err) {
        if (err) callback(err);
        else {
          delete data.config;
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
        };
      }, function(err) {
        if (err) callback(err);
        else {
          delete data.config;
          callback(null, data);
        }
      });
    }
  },

  /**
   * Renders tags' pages.
   */
  renderTags: function(callback) {
    if (!this.tagTemplate) return callback();
    // TODO: renders pages for each tag
  },

  /**
   * Renders with pagination.
   */
  paginate: function(pageName, tpl, data, callback) {
    var output = this.output, pages = data.pages, urlBlog = this.urlBlog,
      paths, arr, name, i,
      total = pages.total, perPage = pages.perPage, curr = 1;

    name = pageName + '.html';
    pages.links = [ joinUrl(urlBlog, name) ];
    paths = [ path.join(output, name) ];
    arr = [ 0 ];
    for (i = 1; i < total; i++) {
      name = pageName + '-page-' + (i + 1) + '.html';
      paths[i] = path.join(output, name);
      pages.links[i] = joinUrl(urlBlog, name);
      arr[i] = i;
    }
    async.each(arr, function(i, fn) {
      pages.prevLink = pages.links[i - 1] || null;
      pages.nextLink = pages.links[i + 1] || null;
      pages.current = i + 1;
      data.posts = data.allPosts.slice(perPage * i, perPage * (i + 1));
      // TODO: figure out why an attr `post` was added to `data`
      tpl.render(data, function(err, html) {
        if (err) return fn(err);
        fs.writeFile(paths[i], html, fn);
      });
    }, callback);
  },

  procPostData: function(page, post) {
    page.config = this.siteConfig;
    page.title = page.title || 'Untitled';
    page.time = page.time || post.mtime;
    if (!page.time.getTime) page.time = new Date(page.time);
    page.author = page.author || page.config.author;
    if (page.tags && !Array.isArray(page.tags)) {
      page.tags = [ page.tags ];
    }
    page.template = page.template || this.postTemplate;
    page.srcData = post;
    this.parseLink(page);
  },

  parseLink: function(post) {
    var permalink = this.config.permalink,
      output = this.config.output,
      time = post.time,
      title = post.title.replace(/\W+/g, '-').replace(/-*$/, '').toLowerCase(),
      filePath, urlRoot;

    permalink = permalink.replace('{year}', time.getFullYear())
      .replace('{month}', time.getMonth() + 1)
      .replace('{date}', time.getDate())
      .replace('{title}', title);

    if (!path.extname(permalink)) {
      permalink = path.join(permalink, 'index.html');
    }
    if (this.output) {
      filePath = path.join(this.output, permalink);
    }
    if (output) {
      permalink = path.join(output, permalink);
    }
    permalink = joinUrl(this.urlRoot, permalink);
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
