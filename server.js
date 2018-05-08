import express from 'express';
import querystring from 'querystring';
import request from 'request';
import {BASE_UI_URL,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_PERMISSIONS,
  SPOTIFY_REDIRECT_URL} from './src/config';

const app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
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
  const code = req.query.code || null;
  if(code === null) {
    return res.redirect(BASE_UI_URL + '/#' + querystring.stringify({error: 'code_missing'}));
  }

  const requestData = {
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
      return res.redirect(BASE_UI_URL + '/#' + querystring.stringify({error: 'invalid_token'}));
    }

    const {access_token, refresh_token} = body;
    res.redirect(BASE_UI_URL + '/#' +
      querystring.stringify({access_token: access_token, refresh_token: refresh_token}));
  });
});

app.listen(5000, () => {
  console.log('spotify-music-videos server listening on port 5000');
});
