/**
 * Builder - parse and build the website.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  util = require('util'),
  config = require('./config'),
  parser = require('./parser');

function printError(err) {
  console.error('[Error] Failed to build the website:', err);
}

function build(dir) {
  dir = path.resolve(dir || '.');
  fs.stat(dir, function(err, stats) {
    if (!err && stats.isDirectory()) {
      readConf(path.join(dir, 'config.yml'))
    } else if (err) {
      printError(err);
    } else {
      printError('not a directory');
    }
  });
}

function readConf(conf) {
  fs.stat(conf, function(err, stats) {
    if (!err && stats.isFile()) {
      parseConf(conf);
    } else if (err) {
      printError(err);
    } else {
      printError('config.yml does not exist.');
    }
  });
}

function parseConf(conf) {
  var data = config.readFromFile(conf);
  // TODO: deal with config
  console.log(util.inspect(data, false, 10, true));
}

function traverseDir(dir) {
  fs.readdir(dir, function(err, files) {
    if (!err) {
    } else {
      printError(err);
    }
  });
}

module.exports = {
  build: build
};
