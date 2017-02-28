/* globals module, require */
'use strict';
const MergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const Rollup = require('broccoli-rollup');
const stew = require('broccoli-stew');
const path = require('path');
const typescript = require('broccoli-typescript-compiler');

var lib = stew.find('lib');
var ts = typescript(lib);


module.exports = function () {
  return new MergeTrees([
    new Rollup(ts, {
      rollup: {
        entry: 'lib/index.js',
        targets: [{
          dest: 'backburner.js',
          format: 'es',
        }],
        moduleId: 'backburner-ts',
        moduleName: 'Backburner-ts'
      }
    }),
    new Rollup(ts, {
      rollup: {
        entry: 'lib/backburner.tests.js',
        targets: [{
          dest: './tests/backburner.js',
          format: 'es'
        }],
        moduleId: 'backburner-test',
        moduleName: 'Backburner-test'
      }
    }),
    new Rollup(new Funnel('tests', { include: ['**/*.js'], destDir: 'tests' }), {
      rollup: {
        entry: 'tests/index.js',
        external: ['backburner'],
        targets: [{
          dest: 'tests/tests.js',
          format: 'amd',
          moduleId: 'backburner-tests'
        }]
      },
      annotation: 'tests/tests.js'
    }),
    new Funnel(path.dirname(require.resolve('qunitjs')), {
      annotation: 'tests/qunit.{js,css}',
      files: ['qunit.css', 'qunit.js'],
      destDir: 'tests'
    }),
    new Funnel(path.dirname(require.resolve('loader.js')), {
      annotation: 'tests/loader.js',
      files: ['loader.js'],
      destDir: 'tests'
    }),
    new Funnel('tests', {
      files: ['index.html'],
      destDir: 'tests'
    })
  ], {
    annotation: 'dist'
  });
};