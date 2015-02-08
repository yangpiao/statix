/**
 * NOTE: not used
 * Initializes the website directory.
 * @author yangpiao
 */

var path = require('path'),
  fs = require('fs'),
  utils = require('./utils');

/**
 * Creates website's skeleton.
 * @param root {String} The root directory of the website.
 * @param callback {Function} Callback function: `callback(err)`.
 */
function createSiteSkeleton(root, callback) {
  // copy default skeleton
  var skeleton = path.join(__dirname, 'skeleton');
  utils.copy(skeleton, root, callback);
}

/**
 * Initialize the website.
 * @param root {String} The root directory of the website.
 */
module.exports = function(root) {
  root = path.resolve(root || '.');
  fs.stat(root, function(err, stats) {
    if (err) { // diretory doesn't exist
      utils.createDir(root, function(err) {
        if (!err) {
          createSiteSkeleton(root, function(er) {
            if (er) console.error('[Error] Failed: ', er);
            else console.log('Website initilized in ' + root);
          });
        } else {
          console.error('[Error] Failed: ', err);
        }
      });
    } else if (stats.isDirectory()) {
      fs.readdir(root, function(err, files) {
        if (!err && !files.length) { // empty directory
          createSiteSkeleton(root, function(er) {
            if (er) console.error('[Error] Failed: ', er);
            else console.log('Website initilized in ' + root);
          });
        } else if (err) {
          console.error('[Error] Failed: ', err);
        } else {
          console.error('[Error] Failed: ' + root + ' is not empty.');
        }
      });
    } else {
      console.error('[Error] Failed: file ' + root + ' already exists.');
    }
  });
};
