module.exports = function(grunt) {
  // Multi-task for es6-module-transpiler
  function nameFor(path) {
    console.log(path);
    return path.match(/^(?:lib|test|test\/tests)\/(.*)\.js$/)[1];
  }

  grunt.registerMultiTask('transpile', "Transpile ES6 modules into AMD, CJS or globals", function() {
    var Compiler = require("es6-module-transpiler").Compiler;

    var options = this.options({
      format: 'amd'
    });

    this.files.forEach(function(f) {
      var contents = f.src.map(function(path) {
        var compiler = new Compiler(grunt.file.read(path), nameFor(path), options);
        var format;

        switch (options.format) {
          case 'amd':
            console.log("Compiling " + path + " to AMD");
            format = compiler.toAMD;
            break;
          case 'globals':
            format = compiler.toGlobals;
            break;
          case 'commonjs':
            format = compiler.toCJS;
            break;
        }
        return format.call(compiler);
      });

      grunt.file.write(f.dest, contents.join("\n\n"));
    });
  });
};
