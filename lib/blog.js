/**
 * Blog contents handler.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  utils = require('./utils');

module.exports = {
  process: function(opts, callback) {
    utils.mix(this, opts);
    // TODO:
    callback(null, {});
  },
};
