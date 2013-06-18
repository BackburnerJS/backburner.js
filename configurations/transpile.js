module.exports = {
  amd: {
    options: {
      name: '<%= pkg.barename %>',
      format: 'amd'
    },

    src: ["lib/<%= pkg.barename %>/queue.js",
          "lib/<%= pkg.barename %>/deferred_action_queues.js",
          "lib/<%= pkg.barename %>.js"],
    dest: "tmp/<%= pkg.barename %>.amd.js"
  },

  tests: {
    options: {
      name: '<%= pkg.barename %>',
      format: 'amd'
    },

    src: ['test/tests.js', 'test/tests/**/*_test.js'],
    dest: 'tmp/tests.amd.js'
  }
};
