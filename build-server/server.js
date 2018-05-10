'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _config = require('./src/config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function makeRequest(requestData) {
  return new Promise(function (resolve, reject) {
    (0, _request2.default)(requestData, function (error, response, body) {
      console.log('status: ', response.statusCode);
      if (!error && response.statusCode === 200) {
        console.log('1');
        console.log('resolve body: ', body);
        resolve(body);
      } else if (body.error) {
        console.log('2');
        console.log('error body: ', body);
        reject(body.error_description);
      } else {
        console.log('3');
        console.log('error body: ', body);
        console.log('error : ', error);
        reject(error);
      }
    });
  });
}

function getAuthTokens(code) {
  var requestData = {
    url: 'https://accounts.spotify.com/api/token',
    method: 'POST',
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
  return makeRequest(requestData);
}

function getUserId(accessToken) {
  console.log('access token: ', accessToken);
  var requestData = {
    url: 'https://api.spotify.com/v1/me',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + accessToken },
    json: true
  };
  return makeRequest(requestData);
}

var app = (0, _express2.default)();

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  // Request headers you wish to allow
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  // Pass to next layer of middleware
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

app.get('/login-callback', function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee(req, res) {
    var code, _ref2, accessToken, refreshToken, _ref3, userId;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            code = req.query.code;

            if (code) {
              _context.next = 3;
              break;
            }

            return _context.abrupt('return', res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: 'code_missing' })));

          case 3:
            _context.prev = 3;
            _context.next = 6;
            return getAuthTokens(code);

          case 6:
            _ref2 = _context.sent;
            accessToken = _ref2.access_token;
            refreshToken = _ref2.refreshToken;
            _context.next = 11;
            return getUserId(accessToken);

          case 11:
            _ref3 = _context.sent;
            userId = _ref3.id;


            res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({
              accessToken: accessToken,
              refreshToken: refreshToken,
              userId: userId
            }));
            _context.next = 19;
            break;

          case 16:
            _context.prev = 16;
            _context.t0 = _context['catch'](3);

            res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: _context.t0 }));

          case 19:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[3, 16]]);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}());

app.get('/playlists', function (req, res) {
  var accessToken = req.query.accessToken;
  var offset = req.query.offset || 0;
  if (!accessToken || accessToken === '') {
    return res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: 'access_token_missing' }));
  }

  var requestData = {
    url: 'https://api.spotify.com/v1/me/playlists?limit=50&offset=' + offset,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken.toString('base64')
    },
    json: true
  };

  (0, _request2.default)(requestData, function (error, response, body) {
    if (error || response.statusCode !== 200) {
      return res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: error }));
    }

    res.json(body);
  });
});

app.get('/compile-playlist', function (req, res) {
  var accessToken = req.query.accessToken;
  var playlistId = req.query.playlistId;
  var userId = req.query.userId;

  if (!accessToken || !playlistId || !userId) {
    return res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: 'params_missing' }));
  }

  var requestData = {
    url: 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken.toString('base64')
    },
    json: true
  };

  (0, _request2.default)(requestData, function (error, response, body) {
    if (error || response.statusCode !== 200) {
      return res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: error.message }));
    }

    var tracks = body.items.map(function (track) {
      return { name: track.track.name };
    });

    res.json(tracks);
  });
});

app.listen(5000, function () {
  console.log('spotify-music-videos server listening on port 5000');
});

// dont request all parts of tracks for playlist
// get artist names to send to youtube
// promises instead of chained callbacks
// catch expired token