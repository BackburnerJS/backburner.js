module.exports = function(app) {
  app.get('/', function(req, res) {
    res.redirect('/tests/?hidepassed');
  })
};
