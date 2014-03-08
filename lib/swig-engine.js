/**
 * swig engine.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  swig = require('swig'),
  cache = {}, tplDir, fileExt;

module.exports = {
  type: 'swig',

  init: function(options) {
    options = options || {};
    cache = {};
    tplDir = options.templateDir;
    fileExt = options.fileExt;
    if (!tplDir || !fileExt) {
      return console.error('Options missing.');
    }
  },

  readTemplate: function(file, name) {
    name = name || file;
    cache[name] = swig.compileFile(file);
  },

  getTemplate: function(name) {
    if (!cache[name]) return null;
    return {
      name: name,
      render: function(data, callback) {
        try {
          var output = cache[name](data);
          callback(null, output);
        } catch (err) {
          callback(err);
        }
      }
    };
  },

  render: function(name, data, callback) {
    if (!cache[name]) {
      return callback(new Error('Template not found'));
    }
    callback(null, cache[name](data));
  }
};

