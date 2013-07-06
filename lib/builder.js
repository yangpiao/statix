/**
 * Builder - parse and build the website.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  util = require('util'),
  config = require('./config'),
  template = require('./template');

function build(dir) {
  dir = path.resolve(dir || '.');
  fs.stat(dir, function(err, stats) {
    if (!err && stats.isDirectory()) {
      // var data = config.parse(dir, 'config.yml');
      // console.log(util.inspect(data, false, 10, true));
      // reads config
      if (!config.parse(dir, 'config.yml')) return;
      // loads templates
      template.load(dir);
      // TODO: render
    } else if (err) {
      console.error(err.stack || err + '');
    } else {
      console.error(dir + ' is not a directory');
    }
  });
}

module.exports = {
  build: build
};
