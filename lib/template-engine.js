/**
 * Template engine.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  engines = {};

var engine = {
  register: function(eng) {
    var type = eng.type;
    if (type) {
      engines[type] = eng;
    }
  },
  init: function(type, options) {
    if (typeof type !== 'string' || !engines[type]) {
      throw new Error('Engine not found.');
    }
    var eng = engines[type];
    eng.init(options || {});
    this.readTemplate = eng.readTemplate.bind(eng);
    this.getTemplate = eng.getTemplate.bind(eng);
  }
};

engine.register(require('./swig-engine'));
module.exports = engine;

