var path = require('path');

module.exports = function(grunt) {
  var cwd = process.cwd();

  require('./tasks/browser')(grunt);
  require('./tasks/build_tests')(grunt);
  require('./tasks/bytes')(grunt);

  var config = require('load-grunt-config')(grunt, {
    configPath: path.join(cwd, 'tasks', 'options')
  });

  // Alias tasks for the most common sets of tasks.
  // Most of the time, you will use these.

  // By default, (i.e., if you invoke `grunt` without arguments), do
  // a new build.
  this.registerTask('default', ['build']);

  // Build a new version of the library
  this.registerTask('build', "Builds a distributable version of <%= package.name %>", [
    'clean',
    'transpile:amd',
    'transpile:commonjs',
    'concat:library',
    'concat:browser',
    'browser:dist',
    'bytes'
  ]);

  this.registerTask('tests', "Builds the test package", [
    'build',
    'concat:deps',
    'transpile:tests',
    'concat:tests',
    'build_tests:dist'
  ]);

  // Run a server. This is ideal for running the QUnit tests in the browser.
  this.registerTask('server', [
    'build',
    'tests',
    'connect',
    'watch'
  ]);

  this.registerTask('test', [
    'tests',
    'jshint',
    'qunit'
  ]);
};
