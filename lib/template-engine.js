/**
 * Template engine (swig) wrapper.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  swig = require('swig'),
  config = require('./config'),

  cache = {}, tplDir, fileExt;

module.exports = {
  init: function(options) {
    options = options || {};
    cache = {};
    tplDir = options.templateDir;
    fileExt = options.fileExt;
    if (!tplDir || !fileExt) {
      return console.error('Options missing.');
    }
    // swig.init({
    //   root: tplDir
    // });
  },

  readTemplate: function(file, name) {
    name = name || file;
    cache[name] = swig.compileFile(file);
  },

  get: function(name) {
    if (!cache[name]) return null;
    return {
      name: name,
      render: function(data, callback) {
        try {
          // var output = cache[name].render(data);
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
    // callback(null, cache[name].render(data));
    callback(null, cache[name](data));
  }
};
