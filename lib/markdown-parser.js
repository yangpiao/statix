/**
 * Markdown parser.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  marked = require('marked'),
  hljs = require('highlight.js'),
  yaml = require('js-yaml'),
  utils = require('./utils');

marked.setOptions({
  highlight: function(code, lang) {
    if (!hljs.getLanguage(lang)) return code; //hljs.highlightAuto(code).value;
    else return hljs.highlight(lang, code).value;
  }
});

module.exports = {
  fileExt: [ '.md', '.mkd', '.markdown', 'txt' ],
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
    var parts, index, meta = null, raw, content, excerpt = '';
    try {
      if (inputStr.indexOf('<meta>\n') === 0) {
        inputStr = inputStr.substring(7); // '<meta>\n'.length == 7
        index = inputStr.indexOf('\n</meta>\n');
        parts = [
          inputStr.substring(0, index),
          inputStr.substring(index + 9) // '\n</meta>\n'.length == 9
        ];
      } else {
        parts = [ inputStr ];
      }

      // meta
      if (parts.length == 2) {
        meta = yaml.safeLoad(parts.shift());
      }
      // excerpt
      raw = parts[0];
      parts = raw.split('<!-- $more -->');
      if (parts.length > 1) {
        excerpt = marked(parts.shift());
      }
      // replace <!-- $more --> ???
      content = marked(raw);
      if (meta) {
        result = utils.mix({}, meta, { content: content, excerpt: excerpt });
      } else {
        result = { content: content, excerpt: excerpt };
      }

      if (typeof callback === 'function') callback(null, result);
      else return result;
    } catch (err) {
      if (typeof callback === 'function') callback(err);
      else return null;
    }
  }
};
