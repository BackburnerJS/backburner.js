/* globals module, require */
'use strict';
const MergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const Rollup = require('broccoli-rollup');
const Plugin = require('broccoli-plugin');
const path = require('path');


const walkSync = require('walk-sync');
const fs = require('fs');
const mkdirp = require('mkdirp').sync;

class TestIndex extends Plugin {
  constructor(input) {
    super([input], {
      persistentOutput: true,
      annotation: 'tests/index.js'
    });
  }

  build() {
    let inputPath = this.inputPaths[0];
    let outputPath = this.outputPath + '/tests';
    let testModules = walkSync(inputPath, {
      globs: ['**/*.js']
    }).map(file => {
      let moduleId = file.slice(0, -3);
      return `import './${moduleId}';`;
    }).join('\n');
    mkdirp(outputPath);
    fs.writeFileSync(outputPath + '/index.js', testModules);
  }
}

module.exports = function () {
  return new MergeTrees([
    new Rollup('lib', {
      rollup: {
        entry: 'backburner.js',
        targets: [{
          dest: 'backburner.js',
          format: 'cjs'
        }, {
          dest: 'es6/backburner.js',
          format: 'es'
        }]
      }
    }),
    new Rollup('lib', {
      rollup: {
        entry: 'backburner.tests.js',
        targets: [{
          dest: 'tests/backburner.js',
          format: 'amd',
          moduleId: 'backburner',
          exports: 'named' // for private export Queue
        }]
      }
    }),
    new Rollup(new MergeTrees([
      new TestIndex('tests'),
      new Funnel('tests', {
        include: ['**/*.js'],
        destDir: 'tests'
      })
    ]), {
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
