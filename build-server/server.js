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

var searchYoutube = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee2(track) {
    var res;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return youtube.search.list({
              part: 'id,snippet',
              q: track.name,
              maxResults: 3,
              type: 'video'
            });

          case 2:
            res = _context2.sent;
            return _context2.abrupt('return', res.data.items[0].id.videoId);

          case 4:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function searchYoutube(_x4) {
    return _ref2.apply(this, arguments);
  };
}();

var getYoutubeVideoIds = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee4(tracks) {
    var _this = this;

    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return Promise.all(tracks.map(function () {
              var _ref4 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee3(track) {
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        _context3.next = 2;
                        return searchYoutube(track);

                      case 2:
                        return _context3.abrupt('return', _context3.sent);

                      case 3:
                      case 'end':
                        return _context3.stop();
                    }
                  }
                }, _callee3, _this);
              }));

              return function (_x6) {
                return _ref4.apply(this, arguments);
              };
            }()));

          case 2:
            return _context4.abrupt('return', _context4.sent);

          case 3:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function getYoutubeVideoIds(_x5) {
    return _ref3.apply(this, arguments);
  };
}();

var createYoutubePlaylist = function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee5(playlistName) {
    var res;
    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;
            _context5.next = 3;
            return youtube.playlists.insert({
              part: 'snippet,status',
              resource: {
                snippet: {
                  title: playlistName,
                  description: 'A playlist created by spotify-music-videos'
                },
                status: {
                  privacyStatus: 'unlisted'
                }
              }
            });

          case 3:
            res = _context5.sent;
            return _context5.abrupt('return', res.data.id);

          case 7:
            _context5.prev = 7;
            _context5.t0 = _context5['catch'](0);
            return _context5.abrupt('return', _config.YOUTUBE_DEFAULT_PLAYLIST_ID);

          case 10:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this, [[0, 7]]);
  }));

  return function createYoutubePlaylist(_x7) {
    return _ref5.apply(this, arguments);
  };
}();

var addToYoutubePlaylist = function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee6(playlistId, videoId) {
    var res;
    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return youtube.playlistItems.insert({
              part: 'id,snippet',
              resource: {
                snippet: {
                  playlistId: playlistId,
                  resourceId: {
                    videoId: videoId,
                    kind: "youtube#video"
                  }
                }
              }
            });

          case 2:
            res = _context6.sent;

          case 3:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function addToYoutubePlaylist(_x8, _x9) {
    return _ref6.apply(this, arguments);
  };
}();

var makeYoutubePlaylist = function () {
  var _ref7 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee8(tracks, playlistName) {
    var _this2 = this;

    var videoIds, playlistId;
    return _regenerator2.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return getYoutubeVideoIds(tracks);

          case 2:
            videoIds = _context8.sent;
            _context8.next = 5;
            return createYoutubePlaylist(playlistName);

          case 5:
            playlistId = _context8.sent;
            _context8.next = 8;
            return Promise.all(videoIds.map(function () {
              var _ref8 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee7(videoId) {
                return _regenerator2.default.wrap(function _callee7$(_context7) {
                  while (1) {
                    switch (_context7.prev = _context7.next) {
                      case 0:
                        _context7.next = 2;
                        return addToYoutubePlaylist(playlistId, videoId);

                      case 2:
                        return _context7.abrupt('return', _context7.sent);

                      case 3:
                      case 'end':
                        return _context7.stop();
                    }
                  }
                }, _callee7, _this2);
              }));

              return function (_x12) {
                return _ref8.apply(this, arguments);
              };
            }()));

          case 8:
            return _context8.abrupt('return', 'https://www.youtube.com/watch?list=' + playlistId + '&v=' + videoIds[0]);

          case 9:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function makeYoutubePlaylist(_x10, _x11) {
    return _ref7.apply(this, arguments);
  };
}();

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _googleapis = require('googleapis');

var _config = require('./src/config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var youtubeAuth = new _googleapis.google.auth.OAuth2(_config.YOUTUBE_CLIENT_ID, _config.YOUTUBE_CLIENT_SECRET, 'http://localhost:3000/youtube-login-callback');

youtubeAuth.setCredentials({
  access_token: _config.YOUTUBE_ACCESS_TOKEN,
  refresh_token: _config.YOUTUBE_REFRESH_TOKEN
});

var youtube = _googleapis.google.youtube({
  version: 'v3',
  auth: youtubeAuth
});

function makeRequest(requestData) {
  return new Promise(function (resolve, reject) {
    (0, _request2.default)(requestData, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        resolve(body);
      } else {
        console.log('Error while making request: ' + requestData.method + ' ' + requestData.url);

        if (error) {
          console.log('E1: ', error);
          reject(error);
        } else if (body.error_description) {
          console.log('E2: ', body.error_description);
          reject(body.error_description);
        } else if (body.error) {
          console.log('E3: ' + body.error.status + ' ' + body.error.message);
          reject(body.error.message);
        } else {
          console.log('E4: ', body);
          reject('unknown error');
        }
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
  var _ref9 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee9(req, res) {
    var code, _ref10, accessToken, refreshToken, _ref11, userId;

    return _regenerator2.default.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            code = req.query.code;

            if (code) {
              _context9.next = 3;
              break;
            }

            return _context9.abrupt('return', res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: 'code_missing' })));

          case 3:
            _context9.prev = 3;
            _context9.next = 6;
            return getAuthTokens(code);

          case 6:
            _ref10 = _context9.sent;
            accessToken = _ref10.access_token;
            refreshToken = _ref10.refresh_token;
            _context9.next = 11;
            return getUserId(accessToken);

          case 11:
            _ref11 = _context9.sent;
            userId = _ref11.id;


            res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({
              accessToken: accessToken,
              refreshToken: refreshToken,
              userId: userId
            }));
            _context9.next = 19;
            break;

          case 16:
            _context9.prev = 16;
            _context9.t0 = _context9['catch'](3);

            res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: _context9.t0 }));

          case 19:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, undefined, [[3, 16]]);
  }));

  return function (_x13, _x14) {
    return _ref9.apply(this, arguments);
  };
}());

app.get('/playlists', function () {
  var _ref12 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee10(req, res) {
    var accessToken, offset, playlists;
    return _regenerator2.default.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            accessToken = req.query.accessToken;
            offset = req.query.offset || 0;

            if (!(!accessToken || accessToken === '')) {
              _context10.next = 4;
              break;
            }

            return _context10.abrupt('return', res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: 'access_token_missing' })));

          case 4:
            _context10.prev = 4;
            _context10.next = 7;
            return getPlaylists(accessToken, offset);

          case 7:
            playlists = _context10.sent;

            res.json(playlists);
            _context10.next = 14;
            break;

          case 11:
            _context10.prev = 11;
            _context10.t0 = _context10['catch'](4);

            // res.redirect(BASE_UI_URL + '?' + querystring.stringify({error}));
            res.json({ error: _context10.t0 });

          case 14:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, undefined, [[4, 11]]);
  }));

  return function (_x15, _x16) {
    return _ref12.apply(this, arguments);
  };
}());

app.get('/compile-playlist', function () {
  var _ref13 = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee11(req, res) {
    var accessToken, userId, playlistId, playlistName, tracks, youtubePlaylistUrl;
    return _regenerator2.default.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            accessToken = req.query.accessToken;
            userId = req.query.userId;
            playlistId = req.query.playlistId;
            playlistName = req.query.playlistName;

            if (!(!accessToken || !userId || !playlistId || !playlistName)) {
              _context11.next = 6;
              break;
            }

            return _context11.abrupt('return', res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: 'params_missing' })));

          case 6:
            _context11.prev = 6;
            _context11.next = 9;
            return getTracks(accessToken, userId, playlistId);

          case 9:
            tracks = _context11.sent;
            _context11.next = 12;
            return makeYoutubePlaylist(tracks, playlistName);

          case 12:
            youtubePlaylistUrl = _context11.sent;

            res.json(youtubePlaylistUrl);
            _context11.next = 19;
            break;

          case 16:
            _context11.prev = 16;
            _context11.t0 = _context11['catch'](6);

            res.redirect(_config.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: _context11.t0 }));

          case 19:
          case 'end':
            return _context11.stop();
        }
      }
    }, _callee11, undefined, [[6, 16]]);
  }));

  return function (_x17, _x18) {
    return _ref13.apply(this, arguments);
  };
}());

app.listen(5000, function () {
  console.log('spotify-music-videos server listening on port 5000');
});

// dont request all parts of tracks for playlist
// get artist names to send to youtube
// promises instead of chained callbacks
// catch expired token