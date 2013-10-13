var port = parseInt(process.env.PORT || 8000, 10);

module.exports = {
  server: {},
  options: {
    hostname: '0.0.0.0',
    port: port,
    base: '.'
  }
};
