/**
 * Initializes the website directory.
 * @author yangpiao
 */

var path = require('path'),
  fs = require('fs'),
  utils = require('./utils');

/**
 * Creates website's skeleton.
 * @param root {String} The root directory of the website.
 */
function createSiteSkeleton(root) {
  // copy default skeleton
  var skeleton = path.join(__dirname, 'skeleton');
  return utils.copy(skeleton, root);
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
          var e = createSiteSkeleton(root);
          if (e) console.error('[Error]', e);
        } else {
          console.error('[Error] Failed to initialize the website: ', err);
        }
      });
    } else if (stats.isDirectory()) {
      fs.readdir(root, function(err, files) {
        if (!err && !files.length) { // empty directory
          var e = createSiteSkeleton(root);
          if (e) console.error('[Error]', e);
        } else if (err) {
          console.error('[Error] Failed to initialize the website: ', err);
        } else {
          console.error('[Error] Failed to initialize the website: ' +
            'directory is not empty.');
        }
      });
    } else {
      console.error('[Error] Failed to initialize the website: ' +
        'file already exists.');
    }
  });
};
