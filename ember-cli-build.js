/* globals module, require */
'use strict';
const MergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const Rollup = require('broccoli-rollup');
const path = require('path');
const typescript = require('broccoli-typescript-compiler');


module.exports = function () {  
  const lib = typescript(path.join(__dirname, '/lib'), {
    tsconfig: {
      compilerOptions: {
        module: 'es6',
        target: 'es6',
        removeComments: true,
        moduleResolution: 'node'
      }
    }
  });
  return new MergeTrees([
    new Rollup(lib, {
      rollup: {
        entry: 'index.js',
        targets: [{
          dest: 'backburner.js',
          format: 'es',
          exports: 'named'
        },{
          dest: 'es6/backburner.js',
          format: 'es',
          exports: 'named'
        }]
      }
    }),
    new Rollup(lib, {
      rollup: {
        entry: 'index.js',
        targets: [{
          dest: 'tests/backburner.js',
          format: 'amd',
          moduleId: 'backburner',
          exports: 'named'
        }]
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
    new Funnel(path.join(__dirname, '/tests'), {
      files: ['index.html'],
      destDir: 'tests'
    })
  ], {
    annotation: 'dist'
  });
};
