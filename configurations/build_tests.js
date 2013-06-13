module.exports = {
  dist: {
    src: ['vendor/loader.js', 'tmp/tests.amd.js', 'tmp/deps.amd.js', 'tmp/<%= pkg.barename%>.amd.js'],
    dest: 'tmp/tests.js'
  }
};
