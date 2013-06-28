/**
 * Config handler.
 * @author yangpiao
 */

var fs = require('fs'),
  yaml = require('js-yaml'),
  utils = require('./utils');

var defaultConfig = utils.freezeObject({
  title: 'Website Title',
  subtitle: 'Website subtitle',
  keywords: '',
  description: '',
  src_directories: {
    templates: 'templates',
    contents: 'contents',
    helpers: 'helpers',
    output: 'output'
  },
  template: 'default'
});

module.exports = {
  default: defaultConfig,

  compile: function(confPath) {
    try {
      var conf = fs.readFileSync(confPath, 'utf8');
      return yaml.safeLoad(conf);
    } catch (err) {
      console.error(err.stack || String(err));
      return null;
    }
  }
};
