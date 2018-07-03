'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _googleapis = require('googleapis');

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

var SPOTIFY_PERMISSIONS = ['user-library-read', 'playlist-read-collaborative', 'playlist-read-private'];
var YOUTUBE_PERMISSIONS = ['https://www.googleapis.com/auth/youtube'];

var youtubeAuth = new _googleapis.google.auth.OAuth2(process.env.YOUTUBE_CLIENT_ID, process.env.YOUTUBE_CLIENT_SECRET, process.env.YOUTUBE_REDIRECT_URL);

youtubeAuth.setCredentials({
  access_token: process.env.YOUTUBE_ACCESS_TOKEN,
  refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
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
      redirect_uri: process.env.SPOTIFY_REDIRECT_URL,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + new Buffer(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
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

function getSpotifyPlaylists(accessToken, offset) {
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

async function getTracks(accessToken, userId, playlistId) {
  var requestData = {
    url: 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks?fields=total,limit,items.track(name,artists(name))',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken.toString('base64')
    },
    json: true
  };

  var requestResponse = await makeRequest(requestData);
  return requestResponse.items.map(function (track) {
    return {
      trackName: track.track.name,
      artistName: track.track.artists[0].name
    };
  });
}

async function searchYoutube(track) {
  var res = await youtube.search.list({
    part: 'id,snippet',
    q: track.trackName + ' ' + track.artistName + ' music video',
    maxResults: 3,
    type: 'video'
  });
  return res.data.items[0].id.videoId;
}

async function getYoutubeVideoIds(tracks) {
  return await Promise.all(tracks.map(async function (track) {
    return await searchYoutube(track);
  }));
}

async function createYoutubePlaylist(playlistName) {
  try {
    var res = await youtube.playlists.insert({
      part: 'snippet,status',
      resource: {
        snippet: {
          title: 'Music videos: ' + playlistName,
          description: 'A playlist created by spotify-music-videos'
        },
        status: {
          privacyStatus: 'unlisted'
        }
      }
    });

    return res.data.id;
  } catch (error) {
    return process.env.YOUTUBE_DEFAULT_PLAYLIST_ID;
  }
}

function addToYoutubePlaylist(playlistId, videoId) {
  youtube.playlistItems.insert({
    part: 'snippet',
    resource: {
      snippet: {
        playlistId: playlistId,
        resourceId: {
          videoId: videoId,
          kind: 'youtube#video'
        }
      }
    }
  });
}

// TODO: speed this up. dont wait 600, wait until previous execution finishes
async function insertVideosIntoPlaylist(playlistId, videoIds) {
  var index = 0;

  // use for, await before incrementing

  return new Promise(function (resolve, reject) {
    var interval = setInterval(function () {
      if (index == videoIds.length) {
        clearInterval(interval);
        resolve();
      } else {
        addToYoutubePlaylist(playlistId, videoIds[index]);
        index += 1;
      }
    }, 600);
  });
}

async function makeYoutubePlaylist(tracks, playlistName) {
  var videoIds = await getYoutubeVideoIds(tracks);
  var playlistId = await createYoutubePlaylist(playlistName);
  await insertVideosIntoPlaylist(playlistId, videoIds);

  return 'https://www.youtube.com/watch?list=' + playlistId + '&v=' + videoIds[0];
}

var app = (0, _express2.default)();

app.use(_express2.default.static(_path2.default.join(__dirname, '..', 'client/build')));

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

app.get('/spotify-login', function (req, res) {
  res.redirect('https://accounts.spotify.com/authorize?' + _querystring2.default.stringify({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: SPOTIFY_PERMISSIONS,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URL
  }));
});

app.get('/spotify-login-callback', async function (req, res) {
  var code = req.query.code;
  if (!code) {
    return res.redirect(process.env.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: 'code_missing' }));
  }

  try {
    var _ref = await getAuthTokens(code),
        spotifyAccessToken = _ref.access_token,
        spotifyRefreshToken = _ref.refresh_token;

    var _ref2 = await getUserId(spotifyAccessToken),
        spotifyUserId = _ref2.id;

    res.redirect(process.env.BASE_UI_URL + '?' + _querystring2.default.stringify({
      spotifyAccessToken: spotifyAccessToken,
      spotifyRefreshToken: spotifyRefreshToken,
      spotifyUserId: spotifyUserId
    }));
  } catch (error) {
    console.log('error 1: ', error);
    res.redirect(process.env.BASE_UI_URL + '?' + _querystring2.default.stringify({ error: error }));
  }
});

app.get('/spotify-playlists', async function (req, res) {
  var accessToken = req.query.accessToken;
  var offset = req.query.offset || 0;
  if (!accessToken || accessToken === '') {
    return res.json({ error: 'access_token_missing' });
  }

  try {
    res.json((await getSpotifyPlaylists(accessToken, offset)));
  } catch (error) {
    res.json({ error: error });
  }
});

app.get('/compile-playlist', async function (req, res) {
  var accessToken = req.query.accessToken;
  var userId = req.query.userId;
  var playlistId = req.query.playlistId;
  var playlistName = req.query.playlistName;

  if (!accessToken || !userId || !playlistId || !playlistName) {
    return res.json({ error: 'params_missing' });
  }

  try {
    var tracks = await getTracks(accessToken, userId, playlistId);
    var youtubePlaylistUrl = await makeYoutubePlaylist(tracks, playlistName);
    res.json(youtubePlaylistUrl);
  } catch (error) {
    res.json({ error: error });
  }
});

app.get('*', function (req, res) {
  res.sendFile(_path2.default.join(__dirname, '..', '/client/build/index.html'));
});

var port = process.env.PORT || 5000;
app.listen(port, function () {
  console.log('spotify-music-videos server listening on port ', port);
});

// dont request all parts of tracks artist for playlist
// catch expired token, other error handling
// good spinner that shoes each video being added
// detect non music videos
// save accesstoken, userid in local storage