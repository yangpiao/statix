/**
 * Reads all the contents.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  async = require('async'),
  config = require('./config'),
  blog = require('./blog'),
  template = require('./template'),
  parser = require('./parser'),
  utils = require('./utils'),

  toString = Object.prototype.toString;

function isRegExp(o) {
  return toString.call(o) === '[object RegExp]';
}

var _directory = null, _blogConf = null, _blogData = null,
  _excludes = [ '.DS_Store', /\.git.*/i, /\..*\.swp$/ ];

function ignore(file) {
  var flag = _excludes.some(function(ex) {
    return ((ex.test && ex.test(file)) || file == ex);
  });
  console.log(file, flag);
  return flag;
}

function checkDirectory(directories, directory) {
  return directories.some(function(dir) {
    return (dir.path.indexOf(directory) !== -1);
  });
}

function init(root) {
  var conf = config.content || {},
    dir = conf.directory,
    excludes = conf.excludes;
  _blogConf = conf.blog;
  if (!dir) {
    return new Error('Config missing');
  }
  if (excludes) {
    _excludes = _excludes.concat(excludes);
  }
  try {
    dir = path.resolve(root, dir);
    var stat = fs.statSync(dir);
    if (!stat.isDirectory()) {
      return new Error(dir + ' is not a directory');
    }
    _directory = dir;
    if (_blogConf) {
      var blogDirectory = path.join(root, _blogConf.directory),
        stat = fs.statSync(blogDirectory);
      if (stat.isDirectory()) {
        _blogConf.directory = blogDirectory;
      } else {
        _blogConf = null;
      }
    }
  } catch (err) {
    return err;
  }
}

function renderAll(sources, output, callback) {
  var directories = sources.directories, files = sources.files;
  async.waterfall([
    function(next) {
      async.each(directories, function(dir, fn) {
        utils.createDir(path.join(output, dir.relativePath), fn);
      }, next);
    },

    function(next) {
      async.each(files, function(file, fn) {
        var dstPath = path.join(output, file.relativePath),
          ext = path.extname(file.name);
        if (file.parsable) {
          parser.parse(file.path, function(err, page) {
            if (err) {
              fn(err);
              return;
            }
            // mixes config data
            page.config = config;
            // mixes blog data
            page.blog = _blogData;
            // finds template
            var tpl = template.find(page, file);
            // renders the page
            if (tpl) {
              tpl.render(page, function(err, html) {
                if (err) {
                  fn(err);
                } else {
                  var outputFile = dstPath.replace(ext, page.ext || '.html');
                  fs.writeFile(outputFile, html, fn);
                }
              });
            } else {
              console.warn('Template not found:', file.path);
              fn(null);
            }
          });
        } else {
          utils.copyFile(file.path, dstPath, fn);
        }
      }, next);
    }
  ], callback);
}

module.exports = {
  sources: {
    directories: [],
    files: []
  },

  ignore: ignore,

  /**
   * Loads content files.
   */
  load: function(root, callback) {
    if (typeof root === 'function') {
      callback = root;
      root = null;
    }
    if (root) {
      var err = init(root);
      if (err) {
        return callback(err);
      }
    }

    var sources = this.sources;
    // loads blog contents first
    blog.load(_blogConf, function(err) {
      if (err) {
        return callback(err);
      }
      // processes other contents
      utils.processFiles(_directory, function(file) {
        var name = file.name, fullPath = file.path, st = file.stat,
          relativePath, data;
        if (ignore(name)) {
          return true;
        }
        relativePath = path.relative(_directory, fullPath);
        data = {
          name: name,
          path: fullPath,
          relativePath: relativePath
        };
        if (st.isDirectory() && !checkDirectory(sources.directories, fullPath)) {
          sources.directories.push(data);
        } else if (st.isFile()) {
          data.parsable = parser.support(name);
          sources.files.push(data);
        }
        return false;
      }, callback);
    });
  },

  render: function(output, callback) {
    var sources = this.sources;
    async.waterfall([
      function(next) {
        if (_blogConf) {
          blog.render(output, next);
        } else {
          next(null);
        }
      },
      function(blogData, next) {
        _blogData = blogData || null;
        renderAll(sources, output, next);
      }
    ], callback);
  }
};

