module.exports = function(grunt) {
  function nameFor(path) {
    console.log(path);
    return path.match(/^(?:lib|test|test\/tests)\/(.*)\.js$/)[1];
  }

  this.registerMultiTask('buildTests', "Execute the tests", function() {
    var testFiles = grunt.file.expand('test/tests/**/*_test.js');

    this.files.forEach(function(f) {
      var output = ["(function(globals) {"];

      output.push.apply(output, f.src.map(grunt.file.read));

      testFiles.forEach(function(file) {
        output.push('requireModule("' + nameFor(file) + '");');
      });

      output.push('})(window);');

      grunt.file.write(f.dest, output.join("\n"));
    });
  });
};
