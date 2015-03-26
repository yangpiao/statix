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
  renderer: (function() {
    var renderer = new marked.Renderer();
    renderer.heading = function(text, level, raw) {
      return '<h' + level + ' id="' +
        raw.replace(/[^\w\u00C0-\u1FFF\u3040-\uD7AF]+/g, '-')
          .replace(/^-*|-*$/g, '').toLowerCase() +
        '">' + text + '</h' + level + '>\n';
    };
    return renderer;
  }()),
  breaks: true,
  langPrefix: 'language-',
  highlight: function(code, lang) {
    if (!hljs.getLanguage(lang)) return code; //hljs.highlightAuto(code).value;
    else return hljs.highlight(lang, code, true).value;
  }
});

module.exports = {
  fileExt: [ '.md', '.mkd', '.markdown', '.txt' ],
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
    var parts, index, meta, metaData = null, raw, title, content, excerpt = '';
    try {
      if (inputStr.indexOf('<meta>\n') === 0) {
        inputStr = inputStr.substring(7); // '<meta>\n'.length == 7
        index = inputStr.indexOf('\n</meta>\n');
        meta = inputStr.substring(0, index);
        try {
          metaData = meta ? yaml.safeLoad(meta) : null;
        } catch (e) { }
        raw = inputStr.substring(index + 9) // '\n</meta>\n'.length == 9
      } else {
        // # title
        // > key: no newline following the title
        //
        // the content above will be seen as meta data
        if (inputStr[0] === '#') {
          index = inputStr.indexOf('\n');
          if (index > -1) {
            title = inputStr.substring(1, index).trim();
            inputStr = inputStr.substring(index + 1);
            if (inputStr[0] === '>') {
              index = inputStr.indexOf('\n\n');
              if (index > -1) {
                meta = inputStr.substring(1, index + 1).replace(/\n>/g, '\n');
                inputStr = inputStr.substring(index + 2);
              }
            }
            try {
              metaData = meta ? yaml.safeLoad(meta) : {};
            } catch (e) {
              metaData = {};
            }
            metaData.title = title;
          } else {
            title = inputStr.substring(1).trim();
            metaData = { title: title };
          }
        }
        raw = inputStr;
      }

      // excerpt
      parts = raw.split('<!-- $more -->');
      if (parts.length > 1) {
        excerpt = marked(parts.shift());
      }
      // replace <!-- $more --> ???
      content = marked(raw);
      if (metaData) {
        result = utils.mix({}, metaData, { content: content, excerpt: excerpt });
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
