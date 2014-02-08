module.exports = {
  dist: {
    src: ['vendor/loader.js', 'tmp/tests.amd.js', 'tmp/deps.amd.js', 'dist/<%= package.name %>-<%= package.version %>.amd.js'],
    dest: 'tmp/tests.js'
  }
};
