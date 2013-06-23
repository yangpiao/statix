/**
 * Command line interface.
 * @author yangpiao
 */
var path = require('path');

function init(root) {
  
}

function showHelp(before, after) {
  if (before) console.log('\n' + before);
  console.log('\nAvailable commands:\n');
  console.log('    init [path]: initialize.');
  console.log('    build: build the site.');
  console.log('    server: start the server.');
  console.log('    deploy: deploy the site.');
  console.log('    help: show this help.\n');
  if (after) console.log(after);
}

exports.run = function(process) {
  var argv = process.argv, cmd;
  if (argv.length < 3) {
    showHelp('[Error] No command.');
    return;
  }
  cmd = argv[2];
  switch (cmd) {
  case 'init':
  case 'i':
    init();
    break;

  case 'build':
  case 'b':
    // TODO: builder
    break;

  case 'server':
  case 's':
    // TODO: server
    break;

  case 'deploy':
  case 'd':
    // TODO: deployer
    break;

  case 'help':
  case 'h':
    showHelp();
  default:
    showHelp('[Error] Unknown command.');
    break;
  }
};
