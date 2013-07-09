/**
 * Reads all the contents.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  async = require('async'),
  config = require('./config'),
  blog = require('./blog'),
  parser = require('./parser'),

  blogDirectory = null,
  // uses characters that are not very likely used in a file's name
  toString = Object.prototype.toString;

function isRegExp(o) {
  return toString.call(o) === '[object RegExp]';
}

function Source(filename, filepath, isDir, parsable) {
  this.name = filename;
  this.path = filepath;
  this.isDirectory = isDir|| false;
  this.parsable = parsable|| false;
  this.children = [];
}

module.exports = {
  directory: null,
  assets: null,
  blog: null,
  sources: {
    children: []
  },

  excludes: [ '.DS_Store', /\.git*/ ],
  ignore: function(file) {
    return this.excludes.some(function(ex) {
      return ((ex.test && ex.test(file)) || file == ex);
    });
  },

  init: function(root) {
    var conf = config.current.content || {},
      dir = conf.directory,
      assets = conf.assetsDir,
      blog = conf.blog;
    if (!dir) {
      return new Error('Config missing');
    }
    try {
      dir = path.resolve(root, dir);
      var stat = fs.statSync(dir);
      if (!stat.isDirectory()) return new Error(dir + ' is not a directory');
      this.directory = dir;

      if (assets) {
        assets = path.join(dir, assets);
        stat = fs.statSync(assets);
        if (stat.isDirectory()) this.assets = assets; // ???
      }

      if (blog) {
        blogDirectory = path.join(dir, blog.directory);
        stat = fs.statSync(blogDirectory);
        if (stat.isDirectory()) {
          blog.directory = blogDirectory;
          this.blog = blog;
        }
      }
    } catch (err) {
      return err;
    }
  },

  load: function(root, callback) {
    if (typeof root === 'function') {
      callback = root;
      root = null;
    }
    if (root) {
      var err = this.init(root);
      if (err) return callback(err);
    }

    var dir = this.directory, me = this;
    // processes blog contents first
    blog.process(this.blog, function(err, blogs) {
      if (err) return callback(err);
      me.sources.blogs = blogs; // ???
      // processes other contents
      me.process(dir, me.sources, function(err) {
        if (err) return callback(err);
        callback(null);
      });
    });
  },

  process: function(dir, cache, callback) {
    if (dir === this.blogDirectory) return callback(null);

    var me = this,
      processEach = function(file, fn) {
        if (me.ignore(file)) return fn(null);
        var fullPath = path.join(dir, file),
          relPath = path.relative(me.directory, fullPath);
        fs.stat(fullPath, function(err, st) {
          if (err) return fn(err);
          if (st.isDirectory()) {
            var child = new Source(file, relPath, true);
            cache.children.push(child);
            me.process(fullPath, child, fn);
          } else if (st.isFile()) {
            cache.children.push(
              new Source(file, relPath, false, parser.support(file)));
            fn(null);
          }
        });
      };

    fs.readdir(dir, function(err, files) {
      if (err) return callback(err);
      async.each(files, processEach, callback);
    });
  }
};
