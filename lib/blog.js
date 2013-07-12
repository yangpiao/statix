/**
 * Blog contents handler.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  async = require('async'),
  parser = require('./parser'),
  config = require('./config'),
  template = require('./template'),
  utils = require('./utils');

module.exports = {
  config: {},
  output: null,
  posts: [],

  /**
   * Loads blog sources.
   */
  load: function(opts, callback) {
    this.config = utils.mix({}, opts);
    this.process(this.config.directory, callback);
  },

  process: function(dir, callback) {
    var me = this;
    function processEach(file, fn) {
      var fullPath = path.join(dir, file);
      fs.stat(fullPath, function(err, st) {
        if (err) return fn(err);
        if (st.isDirectory()) {
          me.process(fullPath, fn);
        } else {
          if (st.isFile() && parser.support(file)) {
            me.posts.push({
              name: file,
              path: fullPath,
              atime: st.atime, // file access time
              mtime: st.mtime, // file modify time
              ctime: st.ctime  // inode or file change time
            });
          }
          fn(null);
        }
      });
    }
    fs.readdir(dir, function(err, files) {
      if (err) return callback(err);
      async.each(files, processEach, callback);
    });
  },

  prepareOutput: function(output, callback) {
    var blogOutput = this.config.output;
    if (blogOutput) {
      blogOutput = path.join(output, blogOutput);
      this.output = blogOutput;
      // this.config.output = blogOutput;
      utils.createDir(blogOutput, callback);
    } else {
      this.output = output;
      // this.config.output = output;
      callback();
    }
  },

  /**
   * Renders all the posts.
   * @param output {String} Path to the output directory.
   * @param callback {Function} Callback function: `callback(err)`.
   */
  render: function(output, callback) {
    var posts = this.posts, me = this;
    async.waterfall([
      function(next) {
        me.prepareOutput(output, next);
      },

      function(next) {
        async.each(posts, function(post, fn) {
          var postPath = post.path;
          parser.parse(postPath, function(err, page) {
            if (err) return fn(err);
            page = me.procPostData(post, page);
            var tpl = template.get(page.template);
            if (tpl) {
              tpl.render(page, function(err, html) {
                if (err) return fn(err);
                // delete page.content;
                // delete page.config;
                me.generatePath(post, function(err) {
                  if (err) return fn(err);
                  fs.writeFile(post.outputPath, html, fn);
                });
              });
            } else fn();
          });
        }, next);
      },

      function(next) {
        // sorts posts by time
        posts.sort(function(p1, p2) {
          return p2.time - p1.time;
        });
        me.renderPages(next);
      }
    ], callback);
  },

  renderPages: function(callback) {
    // - {output}/index.html
    // - {output}/page/2/index.html
    // - {output}/page/3/index.html
    // prev / next page
    // TODO
    var output = this.output;
    callback();
  },

  procPostData: function(post, page) {
    page = page || {};
    page.config = config.current;
    page.title = page.title || 'Untitled';
    page.time = page.time || post.mtime;
    if (!page.time.getTime) page.time = new Date(page.time);
    page.author = page.author || page.config.author;
    if (!page.category) {
      page.category = [ this.config.defaultCategory ];
    } else if (!Array.isArray(page.category)) {
      page.category = [ page.category ];
    }
    page.template = page.template || this.config.postTemplate;
    post.data = page;
    post.time = page.time;
    post.title = page.title;
    return page;
  },

  generatePath: function(post, callback) {
    var permalink = this.config.permalink,
      output = this.config.output,
      time = post.time,
      title = post.title.replace(/\W+/g, '-').replace(/-*$/, '').toLowerCase(),
      dirname, filePath;

    permalink = permalink.replace('{year}', time.getFullYear())
      .replace('{month}', time.getMonth() + 1)
      .replace('{date}', time.getDate())
      .replace('{title}', title);

    if (!path.extname(permalink)) {
      dirname = permalink;
      permalink = path.join(permalink, 'index.html');
    } else {
      dirname = path.dirname(permalink);
    }

    if (this.output) {
      filePath = path.join(this.output, permalink);
      dirname = path.join(this.output, dirname);
    }
    if (output) {
      permalink = path.join(output, permalink);
    }
    post.permalink = permalink;
    post.outputPath = filePath;

    // creates directory for the post
    fs.exists(dirname, function(exists) {
      if (!exists) {
        utils.createDir(dirname, callback);
      } else callback();
    });
  }
};
