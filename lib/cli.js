/**
 * Command line interface.
 * @author yangpiao
 */
var init = require('./init'),
  builder = require('./builder');

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

module.exports = function(process) {
  var argv = process.argv, cmd;
  if (argv.length < 3) {
    showHelp('[Error] No command.');
    return -1;
  }
  cmd = argv[2];
  switch (cmd) {
  case 'build':
  case 'b':
    if (argv.length > 4 && argv[4] === '--dev') {
      builder.build(argv[3], true);
    } else {
      builder.build(argv[3], false);
    }
    break;

  case 'help':
  case 'h':
    showHelp();
    break;
  default:
    showHelp('[Error] Unknown command.');
    return -1;
  }
};
