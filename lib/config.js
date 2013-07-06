/**
 * Config handler.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  yaml = require('js-yaml'),
  utils = require('./utils');

var defaultConfig = utils.freezeObject({
  title: 'Statix',
  subtitle: 'Static Website Generator',
  keywords: '',
  description: '',
  author: 'admin',
  rootUrl: 'http://example.com',
  template: {
    name: 'default',
    engine: 'swig',
    directory: 'templates',
    fileExt: [ 'swig', 'html' ]
  },
  content: {
    format: 'markdown',
    directory: 'contents',
    resources: 'public',
    blog: {
      directory: 'posts',
      permalink: '{year}/{month}-{date}-{title}',
      defaultCategory: 'Uncategorized',
      pagination: 10
    }
  },
  output: 'output',
  helpers: 'helpers'
});

module.exports = {
  default: defaultConfig,
  current: {},
  parse: function(dir, file) {
    try {
      var conf = path.join(dir, file),
        stat = fs.statSync(conf), content, data;
      if (!stat.isFile()) {
        console.error(conf + ' is not a file.');
      }
      content = fs.readFileSync(conf, 'utf8');
      data = yaml.safeLoad(content);
      this.current = {};
      return utils.mix(this.current, defaultConfig, data);
    } catch (err) {
      console.error(err.stack || err + '');
      return null;
    }
  }
};
