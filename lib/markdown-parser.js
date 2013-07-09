/**
 * Markdown parser.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  marked = require('marked'),
  yaml = require('js-yaml'),
  utils = require('./utils');

module.exports = {
  fileExt: [ '.md', '.mkd', '.markdown' ],
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
    var parts = inputStr.split(/^>>>$/m), meta, content;
    try {
      if (parts.length === 2) {
        meta = yaml.safeLoad(parts[0]);
        content = marked(parts[1]);
        result = utils.mix({}, meta, { content: content });
      } else {
        content = marked(parts[0]);
        result = { content: content }
      }
      if (typeof callback === 'function') callback(null, result);
      else return result;
    } catch (err) {
      if (typeof callback === 'function') callback(err);
      else return null;
    }
  },
};
