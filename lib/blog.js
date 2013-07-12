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

  // default template
  render: function(callback) {
    var posts = this.posts, me = this;
    async.each(posts, function(post, fn) {
      var postPath = post.path;
      parser.parse(postPath, function(err, page) {
        if (err) return fn(err);
        page = me.procPostData(post, page);
        var tpl = template.get(page.template);
        if (tpl) {
          tpl.render(page, function(err, output) {
            delete page.content;
            delete page.config;
            if (err) return fn(err);
            // TEST
            me.generatePath(post); return fn();
            // not working below
            me.generatePath(post, function(err) {
              if (err) return fn(err);
              fs.writeFile(post.permalink, output, fn);
            });
          });
        } else fn();
      });
    }, callback);
  },

  procPostData: function(post, page) {
    page = utils.mix(page || {}, { config: config.current });
    page.title = page.title || 'Untitled';
    page.time = page.time || post.mtime;
    if (!page.time.getTime) page.time = new Date(page.time);
    page.author = page.author || page.config.author;
    if (!page.category) {
      page.category = [ this.config.defaultCategory ];
    } else if (!Array.isArray(page.category)) {
      page.category = [ page.category ];
    }
    page.template = page.template || this.config.defaultTemplate;
    post.data = page;
    post.time = page.time;
    post.title = page.title;
    return page;
  },

  generatePath: function(post, callback) {
    var permalink = this.config.permalink,
      time = post.time,
      title = post.title.replace(/\W+/g, '-').replace(/-*$/, '').toLowerCase();
    permalink = permalink.replace('{year}', time.getFullYear())
      .replace('{month}', time.getMonth() + 1)
      .replace('{date}', time.getDate())
      .replace('{title}', title);
    if (!path.extname(permalink)) {
      permalink = path.join(permalink, 'index.html');
    }
    post.permalink = permalink;
    // TODO:
    console.log(permalink);
  }
};
