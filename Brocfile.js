/* jshint node:true, undef:true, unused:true */
var AMDFormatter = require('es6-module-transpiler-amd-formatter');
var closureCompiler = require('broccoli-closure-compiler');
var env = process.env.EMBER_ENV;
var compileModules = require('broccoli-compile-modules');
var mergeTrees = require('broccoli-merge-trees');
var moveFile = require('broccoli-file-mover');

var concat           = require('broccoli-concat');
var replace          = require('broccoli-string-replace');
var calculateVersion = require('./lib/calculateVersion');
var path             = require('path');

var trees = [];

var bundle = compileModules('lib', {
  inputFiles: ['backburner.umd.js'],
  output: '/backburner.js',
  formatter: 'bundle',
});

trees.push(bundle);
trees.push(compileModules('lib', {
  inputFiles: ['**/*.js'],
  output: '/amd/',
  formatter: new AMDFormatter()
}));

if (env === 'production') {
  trees.push(closureCompiler(moveFile(bundle, {
    srcFile: 'backburner.js',
    destFile: 'backburner.min.js'
  }), {
    compilation_level: 'ADVANCED_OPTIMIZATIONS',
  }));
} else {

}

var distTree = mergeTrees(trees.concat('config'));
var distTrees = [];

distTrees.push(concat(distTree, {
  inputFiles: [
    'versionTemplate.txt',
    'backburner.js'
  ],
  outputFile: '/backburner.js'
}));

if (env === 'production') {
  distTrees.push(concat(distTree, {
    inputFiles: [
      'versionTemplate.txt',
      'backburner.min.js'
    ],
    outputFile: '/backburner.min.js'
  }));
}


distTree = mergeTrees(distTrees);
var distTree = replace(distTree, {
  files: [
    'backburner.js',
    'backburner.min.js'
  ],
  pattern: {
    match: /VERSION_PLACEHOLDER_STRING/g,
    replacement: calculateVersion()
  }
});

module.exports = distTree;
