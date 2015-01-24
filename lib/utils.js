/**
 * Utility functions.
 * @author yangpiao
 */

var fs = require('fs'),
  path = require('path'),
  async = require('async'),

  slice = Array.prototype.slice,
  toString = Object.prototype.toString;

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
    } else if (err.code === 'EEXIST') {
      callback(null);
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
function copyFile(src, dest, callback) {
  var rs = fs.createReadStream(src),
    ws = fs.createWriteStream(dest);
  rs.pipe(ws);
  rs.on('end', function() { callback(null); });
  rs.once('error', function(err) {
    ws.removeAllListeners('error');
    callback(err);
  });
  ws.once('error', function(err) {
    rs.removeAllListeners('error');
    callback(err);
  });
}

/**
 * Synchronous version of `copyFile`.
 */
function copyFileSync(src, dest) {
  fs.writeFileSync(dest, fs.readFileSync(src));
}

/**
 * Copies files from directory `src` to directory `dest`.
 * Limitations:
 *   - paths must be absolute
 *   - directories must exist
 *
 * TODO: symlink and other type?
 */
function copy(src, dest, callback) {
  async.waterfall([
    function(next) {
      fs.stat(dest, next);
    },
    function(stat, next) {
      if (!stat.isDirectory()) {
        return next(new Error(dest + ' is not a directory.'));
      }
      fs.stat(src, next);
    },
    function(stat, next) {
      if (!stat.isDirectory()) {
        return next(new Error(src + ' is not a directory.'));
      }
      fs.readdir(src, next);
    },
    function(files, next) {
      var copyEach = function(file, fn) {
        var filePath = path.join(src, file), destPath = path.join(dest, file);
        fs.stat(filePath, function(err, stat) {
          if (err) return fn(err);
          if (stat.isDirectory()) {
            createDir(destPath, function(err) {
              if (err) return fn(err);
              copy(filePath, destPath, fn);
            });
          } else if (stat.isFile()) {
            copyFile(filePath, destPath, fn);
          } else {
            fn(null);
          }
        });
      };

      async.each(files, copyEach, next);
    }
  ], callback);
}

/**
 * Synchronous version of `copy`.
 */
function copySync(src, dest) {
  var stat, files;
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
        copySync(filePath, destPath);
      } else if (stat.isFile()) {
        copyFileSync(filePath, destPath);
      }
    });
    return null;
  } catch (err) {
    return err;
  }
}

/**
 * Removes a file or a directory (and all the files in it).
 * @param name {String} Absolute path of the file/directory.
 * @param callback {Function} Callback function: `callback(err)`
 */
function remove(name, callback) {
  fs.stat(name, function(err, st) {
    if (err) return callback(err);
    if (st.isDirectory()) {
      clearDir(name, function(err) {
        if (err) callback(err);
        else fs.rmdir(name, callback);
      });
    } else {
      fs.unlink(name, callback);
    }
  });
}

/**
 * Clears all files in a directory.
 */
function clearDir(dir, callback) {
  fs.readdir(dir, function(err, files) {
    if (err) return callback(err);
    async.each(files, function(file, fn) {
      var fullPath = path.join(dir, file);
      remove(fullPath, fn);
    }, callback);
  });
}

/**
 * Deep freeze.
 */
function freezeObject(obj) {
  var key, value;
  Object.freeze(obj);
  for (key in obj) {
    value = obj[key];
    if (obj.hasOwnProperty(key) &&
      (typeof value === 'object') && // array & object
      !Object.isFrozen(value)) {
      freezeObject(value);
    }
  }
  return obj;
}

function isObject(o) {
  return (toString.call(o) === '[object Object]');
}

/**
 * Mixes objects.
 * `mix(dest, src, src, ..., deep)`
 *
 * @param dest {Object} The target object.
 * @param src {Object} The source object - there could be multiple sources.
 * @param deep {Boolean} If set to true, mixes the objects recursively.
 *                       Default: true.
 */
function mix() {
  if (!arguments.length) return null;
  var dest, sources, deep = arguments[arguments.length - 1];
  if (typeof deep === 'boolean') {
    dest = arguments[0];
    sources = slice.call(arguments, 1, -1);
  } else {
    dest = arguments[0];
    sources = slice.call(arguments, 1);
    deep = true;
  }
  if (sources.length && typeof dest !== 'object') return null;

  sources.forEach(function(src) {
    for (var key in src) {
      if (isObject(src[key]) && deep) {
        dest[key] = mix((dest[key] || {}), src[key]);
      } else {
        dest[key] = src[key];
      }
    }
  });
  return dest;
}

function processFiles(dir, processor, callback) {
  fs.readdir(dir, function(err, files) {
    if (err) {
      callback(err);
      return;
    }
    async.each(files, processEachFile, callback);
  });

  function processEachFile(file, eachCallback) {
    var filePath = path.join(dir, file);
    fs.stat(filePath, function(err, st) {
      if (err) {
        eachCallback(err);
        return;
      }
      processor({
        name: file,
        path: filePath,
        stat: st
      });
      if (st.isDirectory()) {
        processFiles(filePath, processor, eachCallback);
      } else {
        eachCallback(null);
      }
    });
  }
}

module.exports = {
  createDir: createDir,
  createDirSync: createDirSync,
  copy: copy,
  copySync: copySync,
  copyFile: copyFile,
  copyFileSync: copyFileSync,
  remove: remove,
  freezeObject: freezeObject,
  mix: mix,
  processFiles: processFiles
};
