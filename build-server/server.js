'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _config = require('./src/config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/login', function (req, res) {
  res.redirect('https://accounts.spotify.com/authorize?' + _querystring2.default.stringify({
    response_type: 'code',
    client_id: _config.SPOTIFY_CLIENT_ID,
    scope: _config.SPOTIFY_PERMISSIONS,
    redirect_uri: _config.SPOTIFY_REDIRECT_URL
  }));
});

app.get('/login-callback', function (req, res) {
  var code = req.query.code || null;
  if (code === null) {
    return res.redirect(_config.BASE_UI_URL + '/#' + _querystring2.default.stringify({ error: 'code_missing' }));
  }

  var requestData = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: _config.SPOTIFY_REDIRECT_URL,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + new Buffer(_config.SPOTIFY_CLIENT_ID + ':' + _config.SPOTIFY_CLIENT_SECRET).toString('base64')
    },
    json: true
  };

  _request2.default.post(requestData, function (error, response, body) {
    if (error || response.statusCode !== 200) {
      return res.redirect(_config.BASE_UI_URL + '/#' + _querystring2.default.stringify({ error: 'invalid_token' }));
    }

    var access_token = body.access_token,
        refresh_token = body.refresh_token;

    res.redirect(_config.BASE_UI_URL + '/#' + _querystring2.default.stringify({ access_token: access_token, refresh_token: refresh_token }));
  });
});

app.listen(5000, function () {
  console.log('spotify-music-videos server listening on port 5000');
});