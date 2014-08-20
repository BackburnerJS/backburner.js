/* jshint node:true, undef:true, unused:true */
var AMDFormatter = require('es6-module-transpiler-amd-formatter');
var closureCompiler = require('broccoli-closure-compiler');
var compileModules = require('broccoli-compile-modules');
var mergeTrees = require('broccoli-merge-trees');
var moveFile = require('broccoli-file-mover');
var pickFiles = require('broccoli-static-compiler');
var jshint = require('broccoli-jshint');

var concat           = require('broccoli-concat');
var replace          = require('broccoli-string-replace');
var calculateVersion = require('./config/calculateVersion');
var path             = require('path');

var bower = 'bower_components';
var loader = pickFiles(bower, {
  srcDir: '/loader',
  files: [ 'loader.js' ],
  destDir: '/tests'
});

var qunit = pickFiles(bower, {
  srcDir: '/qunit/qunit',
  destDir: '/tests'
});

var testLoader = pickFiles(bower, {
  srcDir: 'ember-cli-test-loader',
  files: [ 'test-loader.js' ],
  destDir: '/tests'
});

var testIndex = pickFiles('tests', {
  srcDir: '/',
  files: ['index.html'],
  destDir: '/tests/'
});

var configTree = pickFiles('config', {
  srcDir: '/',
  files: [ 'versionTemplate.txt' ],
  destDir: '/'
});

var testsTree = pickFiles('tests', {
  srcDir: '/',
  files: [ '**/*.js' ],
  destDir: '/'
});

var jshintLib = jshint('lib');
var jshintTests = jshint(testsTree);

var bundle = compileModules('lib', {
  inputFiles: ['backburner.umd.js'],
  output: '/backburner.js',
  formatter: 'bundle',
});


bundle = concat(mergeTrees([bundle, configTree]), {
  inputFiles: [
    'versionTemplate.txt',
    'backburner.js'
  ],
  outputFile: '/backburner.js'
});

bundle = replace(bundle, {
  files: [ 'backburner.js' ],
  pattern: {
    match: /VERSION_PLACEHOLDER_STRING/g,
    replacement: calculateVersion()
  }
});

function generateNamedAMDTree(inputTree, outputFile) {
  var workingTree = compileModules(inputTree, {
    inputFiles: ['**/*.js'],
    output: '/',
    formatter: new AMDFormatter()
  });

  workingTree = concat(mergeTrees([workingTree, configTree]), {
    inputFiles: [
      'versionTemplate.txt',
      '**/*.js'
    ],
    outputFile: '/' + outputFile
  });

  workingTree = replace(workingTree, {
    files: [ outputFile ],
    pattern: {
      match: /VERSION_PLACEHOLDER_STRING/g,
      replacement: calculateVersion()
    }
  });

  return workingTree;
}

var namedAMDTree = generateNamedAMDTree('lib', 'backburner.amd.js');
var namedAMDTestTree = generateNamedAMDTree(mergeTrees(['lib', testsTree, jshintLib, jshintTests]), 'backburner-tests.amd.js');

var trees = [qunit, loader, testIndex, testLoader, bundle, namedAMDTree, namedAMDTestTree];

if (process.env.ENV === 'production') {
  trees.push(closureCompiler(moveFile(bundle, {
    srcFile: 'backburner.js',
    destFile: 'backburner.min.js'
  }), {
    compilation_level: 'ADVANCED_OPTIMIZATIONS',
  }));
}

module.exports = mergeTrees(trees);
