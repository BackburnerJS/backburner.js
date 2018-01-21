var glob = require('glob');
var path = require('path');
var bench = require('do-you-even-bench');

// to run all (default):
//
// node ./bench/index.js
//
// to run a single benchmark, you can do:
//
// node ./bench/index.js ./bench/benches/some-file.js
var fileGlob = './bench/benches/*.js';
if (process.argv[2]) {
  fileGlob = process.argv[2];
  console.log(fileGlob);
}

var suites = [];
glob.sync(fileGlob).forEach(function(file) {
  var exported = require( path.resolve( file ) );
  if (Array.isArray(exported)) {
    suites = suites.concat(exported);
  } else {
    suites.push(exported);
  }
});

bench(suites);
