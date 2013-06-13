module.exports = {
  all: {
    // TODO: Run jshint on individual files when jshint supports ES6 modules
    src: ['Gruntfile.js', 'dist/<%= pkg.name %>-<%= pkg.version %>.js', 'tmp/tests.js'],
    options: {
      jshintrc: '.jshintrc'
    }
  }
};
