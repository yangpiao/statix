/**
 * JSON parser.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  utils = require('./utils');

module.exports = {
  fileExt: [ '.json' ],
  support: function(file) {
    var ext = path.extname(file).toLowerCase();
    return (this.fileExt.indexOf(ext) !== -1);
  },

  init: function() {
  },

  parseFile: function(file, callback) {
    var me = this;
    fs.readFile(file, 'utf8', function(err, fileContent) {
      if (!err) {
        me.parse(fileContent, callback);
      } else {
        callback(err);
      }
    });
  },

  parse: function(inputStr, callback) {
    try {
      inputStr = inputStr.trim();
      var result = null;
      if (!inputStr.length) result = {};
      else result = JSON.parse(inputStr);
      if (typeof callback === 'function') callback(null, result);
      else return result;
    } catch (err) {
      if (typeof callback === 'function') callback(err);
      else return null;
    }
  },
};
