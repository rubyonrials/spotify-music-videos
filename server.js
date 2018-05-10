import express from 'express';
import querystring from 'querystring';
import request from 'request';
import {BASE_UI_URL,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_PERMISSIONS,
  SPOTIFY_REDIRECT_URL} from './src/config';

function makeRequest(requestData) {
  return new Promise((resolve, reject) => {
    request(requestData, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        resolve(body);
      } else if(error) {
        reject(error);
      } else {
        reject(body.error_description);
      }
    });
  });
}

function getAuthTokens(code) {
  const requestData = {
    url: 'https://accounts.spotify.com/api/token',
    method: 'POST',
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
  return makeRequest(requestData);
}

function getUserId(accessToken) {
  const requestData = {
    url: 'https://api.spotify.com/v1/me',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + accessToken },
    json: true
  };
  return makeRequest(requestData);
}

function getPlaylists(accessToken, offset) {
  const requestData = {
    url: `https://api.spotify.com/v1/me/playlists?limit=50&offset=${offset}`,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + (accessToken.toString('base64'))
    },
    json: true
  };
  return makeRequest(requestData);
}

async function getTracks(accessToken, userId, playlistId) {
  const requestData = {
    url: `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + (accessToken.toString('base64'))
    },
    json: true
  };

  const requestResponse = await makeRequest(requestData);
  return requestResponse.items.map((track) => {
    return {name: track.track.name};
  });
}

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

app.get('/login-callback', async (req, res) => {
  const code = req.query.code;
  if(!code) {
    return res.redirect(BASE_UI_URL + '?' + querystring.stringify({error: 'code_missing'}));
  }

  try {
    const {access_token: accessToken, refresh_token: refreshToken} = await getAuthTokens(code);
    const {id: userId} = await getUserId(accessToken);

    res.redirect(BASE_UI_URL + '?' +
      querystring.stringify({
        accessToken,
        refreshToken,
        userId,
      }));
  } catch(error) {
    res.redirect(BASE_UI_URL + '?' + querystring.stringify({error}));
  }
});

app.get('/playlists', async (req, res) => {
  const accessToken = req.query.accessToken;
  const offset = req.query.offset || 0;
  if(!accessToken || accessToken === '') {
    return res.redirect(BASE_UI_URL + '?' + querystring.stringify({error: 'access_token_missing'}));
  }

  try {
    const playlists = await getPlaylists(accessToken, offset);
    res.json(playlists);
  } catch(error) {
    res.redirect(BASE_UI_URL + '?' + querystring.stringify({error}));
  }
});

app.get('/compile-playlist', async (req, res) => {
  const accessToken = req.query.accessToken;
  const userId = req.query.userId;
  const playlistId = req.query.playlistId;

  if(!accessToken || !userId || !playlistId) {
    return res.redirect(BASE_UI_URL + '?' + querystring.stringify({error: 'params_missing'}));
  }

  try {
    const tracks = await getTracks(accessToken, userId, playlistId);
    res.json(tracks);
  } catch(error) {
    res.redirect(BASE_UI_URL + '?' + querystring.stringify({error}));
  }
});

app.listen(5000, () => {
  console.log('spotify-music-videos server listening on port 5000');
});

// dont request all parts of tracks for playlist
// get artist names to send to youtube
// promises instead of chained callbacks
// catch expired token
