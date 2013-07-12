/**
 * Template handler.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  config = require('./config'),
  engine = require('./template-engine');

module.exports = {
  // directory of the template
  directory: '',
  // supported file extensions
  fileExt: [],

  /**
   * Loads all the templates in the directory.
   */
  // TODO: support changing template engine
  load: function(root) {
    var tplConfig = config.current.template || {},
      tpls = tplConfig.directory,
      tpl = tplConfig.name,
      ext = tplConfig.fileExt, dir;
    if (!tpls || !tpl || !ext) {
      return new Error('Template config missing.');
    }
    ext = (Array.isArray(ext) ? ext : [ ext ]).map(function(e) {
      return '.' + e;
    });
    dir = path.resolve(root, tpls, tpl);
    engine.init({
      templateDir: dir,
      fileExt: ext
    });
    this.directory = dir;
    this.fileExt = ext;
    this.loadDir(dir);
  },

  get: function(tplName) {
    return engine.get(tplName);
  },

  find: function(pageData, fileData) {
    var pTpl = pageData.template,
      fName = fileData.name,
      fBase = path.basename(fName, path.extname(fName)),
      fPath = fileData.path,
      fDir = path.dirname(fPath),
      fDirname = path.basename(fDir),
      fBasePath = path.join(fDir, fBase);

    // console.log('pTpl, fName, fBase, fPath, fDir, fDirname, fBasePath');
    // console.log(pTpl, fName, fBase, fPath, fDir, fDirname, fBasePath);
    return ((pTpl && engine.get(pTpl)) ||
      engine.get(fBasePath) ||
      engine.get(fDir) ||
      engine.get(fBase) ||
      engine.get(fDirname));
  },

  // render: function(data, callback) {
  //   var tplName = data.meta.template;
  //   var tpl = engine.get(tplName);
  //   tpl.render(data, callback);
  // },

  loadDir: function(dir) {
    try {
      var files = fs.readdirSync(dir), fileExt = this.fileExt, me = this;
      files.forEach(function(file) {
        if (file[0] !== '.') {
          var filePath = path.join(dir, file),
            ext = path.extname(file),
            stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            me.loadDir(filePath);
          } else if (stat.isFile() && fileExt.indexOf(ext) !== -1) {
            me.loadFile(filePath);
          }
        }
      });
    } catch (err) {
      console.error(err.stack || err + '');
    }
  },

  loadFile: function(file) {
    var rel = path.relative(this.directory, path.dirname(file)),
      ext = path.extname(file),
      base = path.basename(file, ext),
      name = path.join(rel, base);
    engine.readTemplate(file, name);
  }
};
