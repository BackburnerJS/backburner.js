var baseDistFile = 'dist/backburner.js-<%= pkg.version %>.';
var builds = ['amd.', ''];
var s3Uploads = [];

builds.forEach(function(build){
  var srcFile = baseDistFile + build + 'js';
  s3Uploads.push({ src: srcFile, dest: 'backburner.js/lastest/backburner.' + build + 'js' });
});

module.exports = {
  options: {
    key: process.env.AWS_ACCESS_KEY_ID,
    secret: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: 'builds.emberjs.com',
    access: 'public-read'
  },
  dev: {
    upload: s3Uploads
  }
};