'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _config = require('./src/config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/login', function (req, res) {
  res.redirect('https://accounts.spotify.com/authorize?' + querystring.stringify({
    response_type: 'code',
    client_id: _config.SPOTIFY_CLIENT_ID,
    scope: _config.SPOTIFY_PERMISSIONS,
    redirect_uri: _config.SPOTIFY_REDIRECT_URL
  }));
});

app.listen(5000, function () {
  console.log('spotify-music-videos server listening on port 5000');
});