/**
 * Blog contents handler.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  async = require('async'),
  parser = require('./parser'),
  utils = require('./utils');

module.exports = {
  posts: [],

  /**
   * Loads blog sources.
   */
  load: function(opts, callback) {
    utils.mix(this, opts);
    this.process(this.directory, callback);
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
              atime: st.atime, // file access time
              mtime: st.mtime, // file modify time
              ctime: st.ctime  // inode or file change time
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

  render: function(callback) {
    // TODO
    callback(null);
  }
};
