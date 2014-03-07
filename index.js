module.exports = {
  config: require('./lib/config').current,
  build: require('./lib/builder').build,
  utils: require('./lib/utils'),
  templateEngine: require('./lib/template-engine'),
  parser: require('./lib/parser')
};

