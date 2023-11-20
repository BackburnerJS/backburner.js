/* globals module, require */
'use strict';
const MergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const Rollup = require('broccoli-rollup');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const path = require('path');
const typescript = require('broccoli-typescript-compiler').default;
const buble = require('rollup-plugin-buble');
const fs = require('fs');

const SOURCE_MAPPING_DATA_URL = '//# sourceMap' + 'pingURL=data:application/json;base64,';

module.exports = function (app) {
  const src = new MergeTrees([
    new Funnel(__dirname + '/lib', {
      destDir: 'lib'
    }),
    new Funnel(__dirname + '/tests', {
      destDir: 'tests'
    })
  ]);

  const compiled = typescript(src, {
    throwOnError: process.env.EMBER_ENV === 'production',
  });

  const backburner = new Rollup(compiled, {
    rollup: {
      input: 'lib/index.js',
      output: {
        file: 'es6/backburner.js',
        format: 'es',
        sourcemap: true
      },
      format: 'es',
      plugins: [
        loadWithInlineMap()
      ]
    }
  });

  return new MergeTrees([
    backburner,
    new Rollup(compiled, {
      rollup: {
        input: 'lib/index.js',
        plugins: [
          loadWithInlineMap(),
          buble()
        ],
        output: [{
          file: 'named-amd/backburner.js',
          exports: 'named',
          format: 'amd',
          amd: { id: 'backburner' },
          sourcemap: true
        }, {
          file: 'backburner.js',
          format: 'cjs',
          sourcemap: true
        }]
      }
    }),
    new Rollup(compiled, {
      annotation: 'named-amd/tests.js',
      rollup: {
        input: 'tests/index.js',
        external: ['backburner'],
        plugins: [
          // just used to resolve lolex, which has a malformed `modules` entry point
          resolve({ module: false, main: true }),
          commonjs(),
          loadWithInlineMap(),
          buble()
        ],
        output: [{
          file: 'named-amd/tests.js',
          format: 'amd',
          amd: { id: 'backburner-tests' },
          sourcemap: true
        }]
      }
    }),
    new Funnel(path.dirname(require.resolve('qunit')), {
      annotation: 'tests/qunit.{js,css}',
      destDir: 'tests',
      files: ['qunit.css', 'qunit.js']
    }),
    new Funnel(path.dirname(require.resolve('loader.js')), {
      annotation: 'loader.js',
      destDir: '',
      files: ['loader.js']
    }),
    new Funnel(compiled, {
      destDir: '/',
      include: ['lib/**/*.d.ts'],

      getDestinationPath: function(relativePath) {
        let path = relativePath.substring(4); // Slice off lib
        if (path === 'index.d.ts') {
          return 'backburner.d.ts';
        }
        return path;
      }
    }),
    new Funnel(__dirname + '/tests', {
      destDir: 'tests',
      files: ['index.html']
    }),
    new Funnel(__dirname + "/bench", {
      destDir: "bench",
      files: ["index.html"],
    }),
    new Rollup(__dirname + "/bench", {
      rollup: {
        treeshake: false,
        input: "browser-bench.js",
        external: ["backburner"],
        plugins: [
          resolve(),
          commonjs(),
          loadWithInlineMap(),
        ],
        output: [
          {
            file: "bench/browser-bench.js",
            format: "amd",
            amd: { id: "browser-bench" },
            sourcemap: true,
          },
        ],
      },
    }),
    new Funnel(path.dirname(require.resolve("lodash")), {
      destDir: "bench",
      files: ["lodash.js"],
    }),
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
      return result;
    }
  };
}

function parseSourceMap(base64) {
  return JSON.parse(new Buffer(base64, 'base64').toString('utf8'));
}
