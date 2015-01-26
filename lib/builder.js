/**
 * Builder - parse and build the website.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  async = require('async'),
  config = require('./config'),
  utils = require('./utils'),
  template = require('./template'),
  parser = require('./parser'),
  blog = require('./blog'),
  content = require('./content'),

  _outputPath = null;

function prepareOutput(root, callback) {
  var output = config.output;
  if (!output) {
    return callback(new Error('Output config missing'));
  }
  _outputPath = path.join(root, output);
  fs.exists(_outputPath, function(exists) {
    if (exists) {
      callback(null);
    } else {
      utils.createDir(_outputPath, callback);
    }
  });
}


module.exports = {
  /**
   * Builds the website and saves the files in the output directory.
   * @param root {String} Source directory.
   * @param devMode {Boolean} Development mode.
   */
  build: function(root, devMode) {
    root = path.resolve(root || '.');
    async.waterfall([
      // loads config
      function(next) {
        fs.stat(root, function(err, st) {
          if (err) return next(err);
          if (!st.isDirectory()) {
            next(new Error(root + ' is not a directory'));
            return;
          }
          // reads config
          if (!config.$parse(path.join(root, 'config.yml'), devMode)) {
            next(new Error('Cannot parse config.yml'));
            return;
          }
          next(null);
        });
      },

      // creates output directory
      function(next) {
        prepareOutput(root, next);
      },

      // loads templates
      function(next) {
        template.load(root, next);
      },

      // loads sources
      function(next) {
        content.load(root, next);
      },

      // renders pages
      function(next) {
        content.render(_outputPath, next);
      }
    ], function(err) {
      if (err) {
        console.error('Build failed:', err);
      } else {
        console.log('Build success: files are in ' + _outputPath);
      }
    });
  }
};
