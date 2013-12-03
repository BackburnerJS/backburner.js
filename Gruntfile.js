module.exports = function(grunt) {
  grunt.loadTasks('tasks');

  function config(name) {
    return require('./configurations/' + name);
  }

  // Alias tasks for the most common sets of tasks.
  // Most of the time, you will use these.

  // By default, (i.e., if you invoke `grunt` without arguments), do
  // a new build.
  this.registerTask('default', ['build']);

  // Build a new version of the library
  this.registerTask('build', "Builds a distributable version of <%= pkg.name%>",
                    ['clean', 'transpile:amd', 'concat:library', 'concat:browser', 'browser:dist', 'bytes']);

  this.registerTask('tests', "Builds the test package",
                    ['build', 'concat:deps', 'transpile:tests', 'buildTests:dist']);

  // Run a server. This is ideal for running the QUnit tests in the browser.
  this.registerTask('server', ['build', 'tests', 'connect', 'watch']);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: config('watch'),
    clean: ["dist"],
    qunit: config('qunit'),
    jshint: config('jshint'),
    concat: config('concat'),
    connect: config('connect'),
    browser: config('browser'),
    transpile: config('transpile'),
    buildTests: config('build_tests'),
    s3: config('s3')
  });

  // Load tasks from npm
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-s3');

  grunt.registerTask('test', ['tests', 'qunit', 'jshint']);
};
