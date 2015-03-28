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
  utils = require('./utils'),

  _enabled = false,
  _siteConfig = null,
  _urlRoot = null,
  _blogConfig = null
  _urlBlog = null,
  _outputPath = null,
  _pageTemplates = null,
  _postTemplate = '',
  _tagTemplate = '',
  _files = [],
  _posts = null,
  _tags = null,
  _postsByTag = {};

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

function processPostData(post, file) {
  post.title = post.title ||
    path.basename(file.name, path.extname(file.name)) ||
    'Untitled';
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
  post.author = post.author || _siteConfig.author;
  if (post.tags && !Array.isArray(post.tags)) {
    post.tags = [ post.tags ];
  }
  post.template = post.template || _postTemplate;
  post.fileData = file;
  parsePermalink(post);
}

function parsePermalink(post) {
  var permalink = _blogConfig.permalink,
    output = _blogConfig.output,
    time = post.time,
    title = post.link || post.title,
    filePath;

  title = title.replace(/[^\w\u00C0-\u1FFF\u3040-\uD7AF]+/g, '-')
    .replace(/^-*|-*$/g, '').toLowerCase();
  permalink = permalink.replace('{year}', time.getFullYear())
    .replace('{month}', time.getMonth() + 1)
    .replace('{date}', time.getDate())
    .replace('{title}', title);

  if (_outputPath) {
    filePath = path.join(_outputPath, permalink);
  }
  if (output) {
    permalink = path.join(output, permalink);
  }
  permalink = joinUrl(_urlRoot, permalink);
  if (!path.extname(permalink)) {
    if (permalink[permalink.length - 1] !== '/') {
      permalink += '/';
    }
    filePath = path.join(filePath, 'index.html');
  }
  post.permalink = permalink;
  post.outputPath = filePath;
}

function generatePath(dirname, callback) {
  fs.exists(dirname, function(exists) {
    if (!exists) {
      utils.createDir(dirname, callback);
    } else {
      callback(null);
    }
  });
}

/**
 * Renders pages other than 'post' and 'tag', templates specified in config.yml.
 */
function renderPages(data, callback) {
  var templates = _pageTemplates, key, tpls = [],
    pagination = _blogConfig.pagination;

  for (key in templates) {
    tpls.push({
      page: (key[key.length - 1] === '/') ? key + 'index' : key,
      name: templates[key]
    });
  }

  if (pagination) {
    var total = Math.ceil(_posts.length / pagination) || 1;
    data.paginate = {
      perPage: pagination,
      total: total,
      current: 1
    };
    async.each(tpls, function(t, fn) {
      var tpl = template.get(t.name);
      if (tpl) {
        paginate(t.page, tpl, _posts, data, fn);
      } else {
        console.warn('[skip] Cannot find template ' + t.name);
        fn();
      }
    }, callback);
  } else {
    data.posts = _posts;
    async.each(tpls, function(t, fn) {
      var tpl = template.get(t.name);
      if (tpl) {
        tpl.render(data, function(err, html) {
          if (err) return fn(err);
          fs.writeFile(path.join(_outputPath, t.page) + '.html', html, fn);
        });
      } else {
        console.warn('[skip] Cannot find template ' + t.name);
        fn();
      }
    }, callback);
  }
}

/**
 * Renders tags' pages.
 */
function renderTags(data, callback) {
  var tplName = _tagTemplate;
  if (!tplName) {
    callback(null);
    return;
  }
  var tpl = template.get(tplName);
  if (!tpl) {
    console.warn('[skip] Cannot find template ' + tplName);
    callback(null);
    return;
  }

  generatePath(path.join(_outputPath, 'tags'), function(err) {
    if (err) {
      callback(err);
      return;
    }
    async.each(_tags, function(tag, fn) {
      data.tag = tag;
      renderTag(tag, tpl, data, fn);
    }, callback);
  });
}

function renderTag(tag, tpl, data, callback) {
  var pagination = _blogConfig.pagination,
    posts = _postsByTag[tag],
    pageName = 'tags/' + tag;

  if (pagination) {
    var total = Math.ceil(posts.length / pagination) || 1;
    data.paginate = {
      perPage: pagination,
      total: total,
      current: 1
    };
    paginate(pageName, tpl, posts, data, callback);
  } else {
    data.posts = posts;
    tpl.render(data, function(err, html) {
      if (err) {
        callback(err);
        return;
      }
      fs.writeFile(path.join(_outputPath, pageName) + '.html', html, callback);
    });
  }
}

/**
 * Renders with pagination.
 */
function paginate(pageName, tpl, allPosts, data, callback) {
  var paginate = data.paginate,
    paths, arr, name, i,
    total = paginate.total, perPage = paginate.perPage, curr = 1;

  name = pageName + '.html';
  paginate.links = [ joinUrl(_urlBlog, name) ];
  paths = [ path.join(_outputPath, name) ];
  arr = [ 0 ];
  for (i = 1; i < total; i++) {
    name = pageName + '-page-' + (i + 1) + '.html';
    paths[i] = path.join(_outputPath, name);
    paginate.links[i] = joinUrl(_urlBlog, name);
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
}


module.exports = {
  enabled: false,
  config: {},
  outputPath: null,

  data: {
    $config: {},
    $tags: [],
    $posts: [],
    $postsByTag: {}
  },

  isEnabled: function() {
    return _enabled;
  },

  init: function(root) {
    _enabled = false;
    _blogConfig = config.content && config.content.blog || null;
    if (_blogConfig) {
      try {
        var blogDirectory = path.join(root, _blogConfig.directory);
        if (fs.statSync(blogDirectory).isDirectory()) {
          _blogConfig.directory = blogDirectory;
          _siteConfig = config;
          _urlRoot = _siteConfig.urlRoot;
          _pageTemplates = utils.mix({}, _blogConfig.templates);
          _postTemplate = _pageTemplates.post || '';
          _tagTemplate = _pageTemplates.tag || '';
          delete _pageTemplates.post;
          delete _pageTemplates.tag;
          this.config = _blogConfig;
          this.data.$config = _siteConfig;
          _enabled = true;
        }
      } catch (err) {
        // do nothing
      }
    }
    return _enabled;
  },

  /**
   * Loads blog sources.
   */
  load: function(callback) {
    if (!_enabled) {
      callback(null);
      return;
    }
    utils.processFiles(this.config.directory, function(file) {
      var name = file.name, path = file.path, st = file.stat;
      if (st.isFile() && parser.support(name)) {
        _files.push({
          name: name,
          path: path,
          mtime: st.mtime // file modified time
        });
      }
    }, callback);
  },

  /**
   * Renders all the posts.
   * @param output {String} Path to the output directory.
   * @param callback {Function} Callback function: `callback(err)`.
   */
  render: function(output, callback) {
    if (!_enabled) {
      callback(null);
      return;
    }

    var me = this;

    async.waterfall([
      function(next) {
        var blogOutput = _blogConfig.output;
        if (blogOutput) {
          _urlBlog = joinUrl(_urlRoot, blogOutput);
          _outputPath = path.join(output, blogOutput);
          utils.createDir(_outputPath, next);
        } else {
          _outputPath = output;
          _urlBlog = _urlRoot;
          next();
        }
      },

      function(next) {
        async.map(_files, function(file, fn) {
          parser.parse(file.path, function(err, post) {
            if (err) {
              fn(err);
              return;
            }
            processPostData(post, file);
            fn(null, post);
          });
        }, next);
      },

      function(posts, next) {
        me.data.$posts = _posts = posts;
        // sorts posts by time, newer in front
        posts.sort(function(p1, p2) {
          return p2.time - p1.time;
        });
        posts.forEach(function(post, index) {
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
            if (!_postsByTag[tag]) {
              _postsByTag[tag] = [];
            }
            _postsByTag[tag].push(post);
          } else {
            for (i = 0, len = tags.length; i < len; i++) {
              tag = tags[i];
              if (!_postsByTag[tag]) {
                _postsByTag[tag] = [];
              }
              _postsByTag[tag].push(post);
            }
          }
        });
        _tags = Object.keys(_postsByTag).sort();
        me.data.$postsByTag = _postsByTag;
        me.data.$tags = _tags;

        // renders each post
        async.each(posts, function(post, fn) {
          var tpl = template.get(post.template);
          post = utils.mix(post, me.data);
          if (tpl) {
            tpl.render(post, function(err, html) {
              if (err) {
                fn(err);
                return;
              }
              generatePath(path.dirname(post.outputPath), function(err) {
                if (err) {
                  fn(err);
                } else {
                  fs.writeFile(post.outputPath, html, fn);
                }
              });
            });
          } else {
            console.error('[skip] Cannot find template ' + post.template);
            fn(); // not interrupting rendering process
          }
        }, next);
      },

      function(next) {
        renderTags(Object.create(me.data), next);
      },

      function(next) {
        renderPages(Object.create(me.data), next);
      }
    ], callback);
  }
};

