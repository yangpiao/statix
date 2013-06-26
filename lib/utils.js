/**
 * Utility functions.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  async = require('async');

/**
 * Creates directory recursively.
 * @param dir {String} The diretory to be created.
 * @param callback {Function} Callback function.
 */
function createDir(dir, callback) {
  fs.mkdir(dir, 0755, function(err) {
    if (!err) {
      callback(null);
    } else if (err.code === 'ENOENT') {
        createDir(path.dirname(dir), function(err) {
          if (!err) createDir(dir, callback);
          else callback(err);
        });
    } else {
      callback(err);
    }
  });
}

/**
 * Synchornized version of `utils.createDir`.
 * @param dir {String} The diretory to be created.
 * @param callback {Function} Callback function.
 */
function createDirSync(dir) {
  try {
    fs.mkdirSync(dir, 0755);
  } catch (err) {
    if (err.code === 'ENOENT') {
      createDirSync(path.dirname(dir));
      createDirSync(dir);
    } else {
      throw err;
    }
  }
}

/**
 * Copies file from `src` to `dest`.
 * Limitations: no validation.
 */
function copyFile(src, dest) {
  var rs = fs.createReadStream(src),
    ws = fs.createWriteStream(dest);
  rs.pipe(ws);
}

/**
 * Copies files from `src` to `dest`.
 * Limitations:
 *   - paths must be absolute
 *   - directories must exist
 *
 * TODO: supports symlink, async?
 */
function copy(src, dest) {
  var stat, files
  try {
    stat = fs.statSync(dest);
    if (!stat.isDirectory()) {
      return new Error(dest + ' is not a directory.');
    }
    stat = fs.statSync(dest);
    if (!stat.isDirectory()) {
      return new Error(src + ' is not a directory.');
    }

    files = fs.readdirSync(src);
    files.forEach(function(file) {
      var filePath = path.join(src, file),
        destPath = path.join(dest, file),
        stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        createDirSync(destPath);
        copy(filePath, destPath);
      } else if (stat.isFile()) {
        copyFile(filePath, destPath);
      }
    });
    return null;
  } catch (err) {
    return err;
  }
}

module.exports = {
  createDir: createDir,
  createDirSync: createDirSync,
  copy: copy,
  copyFile: copyFile
};
