'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var getTracks = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee(accessToken, userId, playlistId) {
    var requestData, requestResponse;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            requestData = {
              url: 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks',
              method: 'GET',
              headers: {
                'Authorization': 'Bearer ' + accessToken.toString('base64')
              },
              json: true
            };
            _context.next = 3;
            return makeRequest(requestData);

          case 3:
            requestResponse = _context.sent;
            return _context.abrupt('return', requestResponse.items.map(function (track) {
              return { name: track.track.name };
            }));

          case 5:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getTracks(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

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
  var requestData = {
    url: 'https://api.spotify.com/v1/me',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + accessToken },
    json: true
  };
  return makeRequest(requestData);
}

function getPlaylists(accessToken, offset) {
  var requestData = {
    url: 'https://api.spotify.com/v1/me/playlists?limit=50&offset=' + offset,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken.toString('base64')
    },
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
  var _ref2 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee2(req, res) {
    var code, _ref3, accessToken, refreshToken, _ref4, userId;

    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            code = req.query.code;

            if (code) {
              _context2.next = 3;
              break;
            }

            return _context2.abrupt('return', res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: 'code_missing' })));

          case 3:
            _context2.prev = 3;
            _context2.next = 6;
            return getAuthTokens(code);

          case 6:
            _ref3 = _context2.sent;
            accessToken = _ref3.access_token;
            refreshToken = _ref3.refresh_token;
            _context2.next = 11;
            return getUserId(accessToken);

          case 11:
            _ref4 = _context2.sent;
            userId = _ref4.id;


            res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({
              accessToken: accessToken,
              refreshToken: refreshToken,
              userId: userId
            }));
            _context2.next = 19;
            break;

          case 16:
            _context2.prev = 16;
            _context2.t0 = _context2['catch'](3);

            res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: _context2.t0 }));

          case 19:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined, [[3, 16]]);
  }));

  return function (_x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}());

app.get('/playlists', function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee3(req, res) {
    var accessToken, offset, playlists;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            accessToken = req.query.accessToken;
            offset = req.query.offset || 0;

            if (!(!accessToken || accessToken === '')) {
              _context3.next = 4;
              break;
            }

            return _context3.abrupt('return', res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: 'access_token_missing' })));

          case 4:
            _context3.prev = 4;
            _context3.next = 7;
            return getPlaylists(accessToken, offset);

          case 7:
            playlists = _context3.sent;

            res.json(playlists);
            _context3.next = 14;
            break;

          case 11:
            _context3.prev = 11;
            _context3.t0 = _context3['catch'](4);

            res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: _context3.t0 }));

          case 14:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined, [[4, 11]]);
  }));

  return function (_x6, _x7) {
    return _ref5.apply(this, arguments);
  };
}());

app.get('/compile-playlist', function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee4(req, res) {
    var accessToken, userId, playlistId, tracks;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            accessToken = req.query.accessToken;
            userId = req.query.userId;
            playlistId = req.query.playlistId;

            if (!(!accessToken || !userId || !playlistId)) {
              _context4.next = 5;
              break;
            }

            return _context4.abrupt('return', res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: 'params_missing' })));

          case 5:
            _context4.prev = 5;
            _context4.next = 8;
            return getTracks(accessToken, userId, playlistId);

          case 8:
            tracks = _context4.sent;

            res.json(tracks);
            _context4.next = 15;
            break;

          case 12:
            _context4.prev = 12;
            _context4.t0 = _context4['catch'](5);

            res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: _context4.t0 }));

          case 15:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined, [[5, 12]]);
  }));

  return function (_x8, _x9) {
    return _ref6.apply(this, arguments);
  };
}());

app.listen(5000, function () {
  console.log('spotify-music-videos server listening on port 5000');
});

// dont request all parts of tracks for playlist
// get artist names to send to youtube
// promises instead of chained callbacks
// catch expired token