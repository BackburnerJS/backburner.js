module.exports = {
  library: {
    src: ['tmp/<%= package.barename %>.amd.js', 'tmp/<%= package.barename %>/**/*.amd.js'],
    dest: 'dist/<%= package.name %>-<%= package.version %>.amd.js'
  },

  deps: {
    src: ['vendor/deps/*.js'],
    dest: 'tmp/deps.amd.js'
  },

  tests: {
    src: ['tmp/tests/**/*_test.amd.js'],
    dest: 'tmp/tests.amd.js'
  },

  browser: {
    src: ['vendor/loader.js', 'dist/<%= package.name %>-<%= package.version %>.amd.js'],
    dest: 'tmp/<%= package.barename %>.browser1.js'
  }
};
