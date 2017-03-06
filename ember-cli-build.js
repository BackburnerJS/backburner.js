/* globals module, require */
'use strict';
const MergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const Rollup = require('broccoli-rollup');
const path = require('path');
const typescript = require('broccoli-typescript-compiler').typescript;

module.exports = function () {
  const src = new MergeTrees([
    new Funnel(path.dirname(require.resolve('@types/qunit/package')), {
      include: [ 'index.d.ts' ],
      destDir: 'qunit'
    }),
    new Funnel(path.join(__dirname, '/lib'), {
      include: [ '**/*.ts' ],
      destDir: 'lib'
    }),
    new Funnel('tests', {
      include: [ '**/*.ts' ],
      destDir: 'tests'
    })
  ]);

  const compiled = typescript(src, {
    tsconfig: {
      compilerOptions: {
        module: 'es2015',
        target: 'es2015',
        removeComments: true,
        moduleResolution: 'node',
        baseUrl: '.',
        paths: {
          backburner: ['lib/index.ts']
        }
      },
      files: ['qunit/index.d.ts', 'lib/index.ts', 'tests/index.ts']
    }
  });

  return new MergeTrees([
    new Rollup(compiled, {
      rollup: {
        entry: 'lib/index.js',
        targets: [{
          dest: 'es6/backburner.js',
          format: 'es',
        }, {
          dest: 'named-amd/backburner.js',
          format: 'amd',
          moduleId: 'backburner',
          exports: 'named'
        }, {
          dest: 'backburner.js',
          format: 'cjs'
        }]
      }
    }),
    new Rollup(compiled, {
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
