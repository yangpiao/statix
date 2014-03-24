/**
 * Config handler.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  yaml = require('js-yaml'),
  utils = require('./utils');

var defaultConfig = utils.freezeObject({
  sitename: 'Statix',
  sitedesc: 'Static Website Generator',
  keywords: '',
  description: '',
  author: 'admin',
  urlRoot: '',
  template: {
    name: 'default',
    directory: 'templates',
    engine: 'swig',
    fileExt: [ 'swig', 'html' ]
  },
  content: {
    format: 'markdown',
    directory: 'contents',
    blog: {
      directory: 'posts',
      output: 'blog',
      permalink: '{year}/{month}-{date}-{title}',
      pagination: 10,
      templates: {}
    }
  },
  output: 'output',
  helpers: 'helpers'
});

module.exports = {
  default: defaultConfig,
  current: {},
  parse: function(dir, file, devMode) {
    try {
      var conf = path.join(dir, file),
        stat = fs.statSync(conf), content, data;
      if (!stat.isFile()) {
        console.error(conf + ' is not a file.');
      }
      content = fs.readFileSync(conf, 'utf8');
      data = yaml.safeLoad(content);
      this.current = {};
      if (devMode && data.dev) {
        utils.mix(this.current, defaultConfig, data, data.dev);
      } else {
        utils.mix(this.current, defaultConfig, data);
      }
      // fixes urlRoot
      this.current.urlRoot = this.current.urlRoot || '';
      return this.current;
    } catch (err) {
      console.error(err.stack || err + '');
      return null;
    }
  }
};
