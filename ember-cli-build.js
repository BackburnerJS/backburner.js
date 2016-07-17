module.exports = function(defaults) {
  var stew = require('broccoli-stew');
  var compileModules = require('broccoli-es6-module-transpiler');
  var AMDFormatter = require('es6-module-transpiler-amd-formatter');
  var ES6Modules = require('broccoli-es6modules');
  var concat = require('broccoli-concat');
  var path = require('path');
  var mv = stew.mv;
  var find = stew.find;
  var log = stew.log;

  var lib       = find('lib');
  var tests     = find('tests');
  var testIndex = find('tests/{index.html}');
  var qunit     = find(path.dirname(require.resolve('qunitjs'))   + '/qunit.{js,css}');
  var loader    = find(path.dirname(require.resolve('loader.js')) + '/{loader.js}');

  qunit  = stew.rename(qunit, path.basename);
  loader = stew.rename(loader, path.basename);

  // folded bundle
  var bundled = compileModules(lib, {
    format: 'bundle',
    entry:  'backburner.umd',
    output: 'backburner.js'
  });

  var amd = new ES6Modules(find(mv(lib, 'lib/', '/'), '!**/*.umd'), {
    esperantoOptions: {
      absolutePaths: true,
      strict: true
    }
  });

  var amdTests = new ES6Modules(find(tests, '**/*-test.js'), {
    esperantoOptions: {
      absolutePaths: true,
      strict: true,
    }
  });

  return stew.find([
    bundled,
    concat(amd, {
      inputFiles: ['**/*.js'],
      outputFile: 'backburner.concat.amd.js'
    }),
    mv(amd, 'amd'),
    testIndex,
    mv(qunit, 'tests'),
    mv(loader, 'tests'),
    concat(amdTests, {
      inputFiles: ['**/*.js'],
      outputFile: 'tests/tests.js'
    })
  ]);
};
