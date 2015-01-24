/**
 * Builder - parse and build the website.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  async = require('async'),
  config = require('./config'),
  utils = require('./utils'),
  template = require('./template'),
  parser = require('./parser'),
  blog = require('./blog'),
  content = require('./content'),

  outputPath = null;

function prepareOutput(root, callback) {
  var output = config.output;
  if (!output) {
    return callback(new Error('Output config missing'));
  }
  outputPath = path.join(root, output);
  fs.exists(outputPath, function(exists) {
    if (exists) {
      callback(null);
    } else {
      utils.createDir(outputPath, callback);
    }
  });
}

module.exports = {
  render: function(sources, src, output, callback) {
    var children = sources.children, me = this;
    async.each(children, function(child, fn) {
      var dstPath = path.join(output, child.name),
        srcPath = path.join(src, child.name),
        ext = path.extname(child.name);
        // srcPath = path.join(content.directory, child.path);
      if (child.isDirectory) {
        utils.createDir(dstPath, function(err) {
          if (err) return fn(err);
          me.render(child, srcPath, dstPath, fn);
        });
      } else if (child.parsable) {
        parser.parse(srcPath, function(err, page) {
          if (err) return fn(err);
          // mixes config data
          page.config = config;
          // mixes blog data
          page.blog = me.blogData;
          // page = utils.mix(page, { config: config });
          // finds template
          var tpl = template.find(page, child);
          // renders the page
          if (tpl) {
            tpl.render(page, function(err, html) {
              if (err) return fn(err);
              fs.writeFile(dstPath.replace(ext, page.ext || '.html'), html, fn);
            });
          } else fn();
        });
      } else {
        utils.copyFile(srcPath, dstPath, fn);
      }
    }, callback);
  },

  /**
   * Builds the website and saves the files in the output directory.
   * @param root {String} Source directory.
   * @param devMode {Boolean} Development mode.
   */
  build: function(root, devMode) {
    var me = this;
    root = path.resolve(root || '.');
    async.waterfall([
      // loads config
      function(next) {
        fs.stat(root, function(err, st) {
          if (err) return next(err);
          if (!st.isDirectory()) {
            return next(new Error(root + ' is not a directory'));
          }
          // reads config
          if (!config.$parse(path.join(root, 'config.yml'), devMode)) {
            return next(new Error('Cannot parse config.yml'));
          }
          next();
        });
      },

      // creates output directory
      function(next) {
        prepareOutput(root, next);
      },

      // loads templates
      function(next) {
        template.load(root, next);
      },

      // loads sources
      function(next) {
        content.load(root, next);
      },

      // renders blogs
      function(next) {
        if (content.blog) blog.render(outputPath, next);
        else next();
      },

      // renders other pages
      function(blogData, next) {
        me.blogData = blogData || null;
        me.render(content.sources, content.directory, outputPath, next);
      }
    ], function(err) {
      if (err) console.error('Build failed:', err);
      else console.log('Build success: files are in ' + outputPath);
    });
  }
};
