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
      destDir: 'qunit',
      include: [ 'index.d.ts' ]
    }),
    new Funnel(path.join(__dirname, '/lib'), {
      destDir: 'lib',
      include: [ '**/*.ts' ]
    }),
    new Funnel('tests', {
      destDir: 'tests',
      include: [ '**/*.ts' ]
    })
  ]);

  const compiled = typescript(src, {
    tsconfig: {
      compilerOptions: {
        baseUrl: '.',
        module: 'es2015',
        moduleResolution: 'node',
        paths: {
          backburner: ['lib/index.ts']
        },
        strictNullChecks: true,
        target: 'es2015'
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
          exports: 'named',
          format: 'amd',
          moduleId: 'backburner'
        }, {
          dest: 'backburner.js',
          format: 'cjs'
        }]
      }
    }),
    new Rollup(compiled, {
      annotation: 'tests/tests.js',
      rollup: {
        entry: 'tests/index.js',
        external: ['backburner'],
        targets: [{
          dest: 'tests/tests.js',
          format: 'amd',
          moduleId: 'backburner-tests'
        }]
      }
    }),
    new Funnel(path.dirname(require.resolve('qunitjs')), {
      annotation: 'tests/qunit.{js,css}',
      destDir: 'tests',
      files: ['qunit.css', 'qunit.js']
    }),
    new Funnel(path.dirname(require.resolve('loader.js')), {
      annotation: 'tests/loader.js',
      destDir: 'tests',
      files: ['loader.js']
    }),
    new Funnel(path.join(__dirname, '/tests'), {
      destDir: 'tests',
      files: ['index.html']
    })
  ], {
    annotation: 'dist'
  });
};
