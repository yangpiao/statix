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
  urlRoot: '/',
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
      pagination: 0,
      templates: {
        // post: 'blog/post',
        // index: 'blog/index',
        // archive: 'blog/archive',
        // tag: 'blog/tag'
      }
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
