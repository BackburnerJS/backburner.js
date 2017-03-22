/* globals module, require */
'use strict';
const MergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const Rollup = require('broccoli-rollup');
const path = require('path');
const typescript = require('broccoli-typescript-compiler').typescript;
const buble = require('rollup-plugin-buble');
const fs = require('fs');

const SOURCE_MAPPING_DATA_URL = '//# sourceMap' + 'pingURL=data:application/json;base64,';

module.exports = function () {
  const src = new MergeTrees([
    new Funnel(path.dirname(require.resolve('@types/qunit/package')), {
      destDir: 'qunit',
      include: [ 'index.d.ts' ]
    }),
    new Funnel(__dirname + '/lib', {
      destDir: 'lib'
    }),
    new Funnel(__dirname + '/tests', {
      destDir: 'tests'
    })
  ]);

  const compiled = typescript(src, {
    tsconfig: {
      compilerOptions: {
        baseUrl: '.',
        inlineSourceMap: true,
        inlineSources: true,
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

  const backburner = new Rollup(compiled, {
    rollup: {
      dest: 'es6/backburner.js',
      entry: 'lib/index.js',
      format: 'es',
      plugins: [
        loadWithInlineMap()
      ],
      sourceMap: true
    }
  });

  return new MergeTrees([
    backburner,
    new Rollup(compiled, {
      rollup: {
        entry: 'lib/index.js',
        plugins: [
          loadWithInlineMap(),
          buble()
        ],
        sourceMap: true,
        targets: [{
          dest: 'named-amd/backburner.js',
          exports: 'named',
          format: 'amd',
          moduleId: 'backburner',
        }, {
          dest: 'backburner.js',
          format: 'cjs',
        }]
      }
    }),
    new Rollup(compiled, {
      annotation: 'named-amd/tests.js',
      rollup: {
        entry: 'tests/index.js',
        external: ['backburner'],
        plugins: [
          loadWithInlineMap(),
          buble()
        ],
        sourceMap: true,
        targets: [{
          dest: 'named-amd/tests.js',
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
    new Funnel(__dirname + '/tests', {
      destDir: 'tests',
      files: ['index.html']
    })
  ], {
    annotation: 'dist'
  });
};

function loadWithInlineMap() {
  return {
    load: function (id) {
      var code = fs.readFileSync(id, 'utf8');
      var result = {
        code: code,
        map: null
      };
      var index = code.lastIndexOf(SOURCE_MAPPING_DATA_URL);
      if (index === -1) {
        return result;
      }
      result.code = code.slice(0, index);
      result.map = parseSourceMap(code.slice(index + SOURCE_MAPPING_DATA_URL.length));
      result.file = id;
      console.log(id);
      console.log(result.map.sources);
      console.log(result.map.sourcesContent.map((c) => !!c));
      return result;
    }
  };
}

function parseSourceMap(base64) {
  return JSON.parse(new Buffer(base64, 'base64').toString('utf8'));
}
