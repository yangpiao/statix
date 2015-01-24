/**
 * Config handler.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  yaml = require('js-yaml'),
  utils = require('./utils');

module.exports = {
  $parse: function(file, devMode) {
    try {
      var stat = fs.statSync(file), content, data;
      if (!stat.isFile()) {
        console.error(file + ' is not a file.');
        return false;
      }
      content = fs.readFileSync(file, 'utf8');
      data = yaml.safeLoad(content);
      // this.current = {};
      if (devMode && data.dev) {
        utils.mix(this, data, data.dev);
      } else {
        utils.mix(this, data);
      }
      // fixes urlRoot
      this.urlRoot = this.urlRoot || '';
      this.buildtime = new Date();
      return true;
    } catch (err) {
      console.error(err.stack || err + '');
      return false;
    }
  }
};
