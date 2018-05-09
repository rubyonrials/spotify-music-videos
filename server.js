import express from 'express';
import querystring from 'querystring';
import request from 'request';
import {BASE_UI_URL,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_PERMISSIONS,
  SPOTIFY_REDIRECT_URL} from './src/config';

const app = express();

app.use((req, res, next) => {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  // Request headers you wish to allow
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  // Pass to next layer of middleware
  next();
});

app.get('/login', (req, res) => {
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: SPOTIFY_PERMISSIONS,
      redirect_uri: SPOTIFY_REDIRECT_URL,
    }));
});

app.get('/login-callback', (req, res) => {
  const code = req.query.code;
  if(!code) {
    return res.redirect(BASE_UI_URL + '?' + querystring.stringify({error: 'code_missing'}));
  }

  let requestData = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: SPOTIFY_REDIRECT_URL,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'))
    },
    json: true
  };

  request.post(requestData, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      return res.redirect(BASE_UI_URL + '?' + querystring.stringify({error: 'invalid_token'}));
    }

    const {access_token, refresh_token} = body;
    requestData = {
      url: 'https://api.spotify.com/v1/me',
      headers: { 'Authorization': 'Bearer ' + access_token },
      json: true
    };

    request.get(requestData, (error, response, body) => {
      if (error || response.statusCode !== 200) {
        return res.redirect(BASE_UI_URL + '?' + querystring.stringify({error}));
      }

      res.redirect(BASE_UI_URL + '?' +
        querystring.stringify({
          access_token: access_token,
          refresh_token: refresh_token,
          user_id: body.id,
        }));
    });
  });
});

app.get('/playlists', (req, res) => {
  const accessToken = req.query.accessToken;
  const offset = req.query.offset || 0;
  if(!accessToken) {
    return res.redirect(BASE_UI_URL + '?' + querystring.stringify({error: 'access_token_missing'}));
  }

  const requestData = {
    url: `https://api.spotify.com/v1/me/playlists?limit=50&offset=${offset}`,
    headers: {
      'Authorization': 'Bearer ' + (accessToken.toString('base64'))
    },
    json: true
  };

  request.get(requestData, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      return res.redirect(BASE_UI_URL + '?' + querystring.stringify({error}));
    }

    res.json(body);
  });
});

app.get('/compile-playlist', (req, res) => {
  const accessToken = req.query.accessToken;
  const playlistId = req.query.playlistId;
  const userId = req.query.userId;

  if(!accessToken || !playlistId || !userId) {
    return res.redirect(BASE_UI_URL + '?' + querystring.stringify({error: 'params_missing'}));
  }

  const requestData = {
    url: `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
    headers: {
      'Authorization': 'Bearer ' + (accessToken.toString('base64'))
    },
    json: true
  };

  request.get(requestData, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      return res.redirect(BASE_UI_URL + '?' + querystring.stringify({error}));
    }

    const tracks = body.items.map((track) => {
      return {name: track.track.name};
    });

    res.json(tracks);
  });
});

app.listen(5000, () => {
  console.log('spotify-music-videos server listening on port 5000');
});

// dont request all parts of tracks for playlist
// get artist names to send to youtube
// promises instead of chained callbacks
// catch expired token
