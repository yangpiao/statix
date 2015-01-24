/**
 * Template handler.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  config = require('./config'),
  engine = require('./template-engine'),
  utils = require('./utils'),

  _directory = null,
  _fileExt = null;

function loadDir(dir, callback) {
  utils.processFiles(dir, function(file) {
    var filename = file.name, filePath = file.path, fileStat = file.stat;
    if (fileStat.isFile() && _fileExt.indexOf(path.extname(filename)) !== -1) {
      var rel = path.relative(_directory, path.dirname(filePath)),
        ext = path.extname(filePath),
        base = path.basename(filePath, ext),
        name = path.join(rel, base);
      engine.readTemplate(filePath, name);
    }
  }, callback);
}


module.exports = {
  // directory of the template
  directory: '',
  // supported file extensions
  fileExt: [],

  /**
   * Loads all the templates in the directory.
   */
  load: function(root, callback) {
    var tplConfig = config.template || {},
      tplDir = tplConfig.directory,
      tpl = tplConfig.name,
      type = tplConfig.engine;

    _fileExt = tplConfig.fileExt;
    if (!tplDir || !tpl || !type || !_fileExt) {
      callback(new Error('Template config missing.'));
    }
    _fileExt = (Array.isArray(_fileExt) ? _fileExt : [ _fileExt ]).map(function(e) {
      return '.' + e;
    });
    _directory = path.resolve(root, tplDir, tpl);
    try {
      engine.init(type, {
        templateDir: _directory,
        fileExt: _fileExt
      });
    } catch (e) {
      callback(e);
    }
    this.directory = _directory;
    this.fileExt = _fileExt;
    loadDir(_directory, callback);
  },

  get: function(tplName) {
    return engine.getTemplate(tplName);
  },

  find: function(pageData, fileData) {
    var pTpl = pageData.template,
      fName = fileData.name,
      fBase = path.basename(fName, path.extname(fName)),
      fPath = fileData.path,
      fDir = path.dirname(fPath),
      fDirname = path.basename(fDir),
      fBasePath = path.join(fDir, fBase);

    return ((pTpl && engine.getTemplate(pTpl)) ||
      engine.getTemplate(fBasePath) ||
      engine.getTemplate(fDir) ||
      engine.getTemplate(fBase) ||
      engine.getTemplate(fDirname));
  }
};
