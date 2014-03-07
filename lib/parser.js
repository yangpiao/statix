/**
 * Parser.
 */

var path = require('path'),

  parserWrapper = {
    parsers: {},

    register: function(parser) {
      var parsers = this.parsers;
      parser.fileExt.forEach(function(ext) {
        parsers[ext.toLowerCase()] = parser;
      });
    },

    support: function(file) {
      var ext = path.extname(file).toLowerCase();
      return !!this.parsers[ext];
    },

    parse: function(file, callback) {
      var me = this, ext = path.extname(file).toLowerCase(),
        parser = this.parsers[ext];
      if (!parser) return callback(new Error(file + ' is not suppported'));
      parser.parseFile(file, callback);
    }
  };

parserWrapper.register(require('./json-parser'));
parserWrapper.register(require('./markdown-parser'));

module.exports = parserWrapper;
