import {SPOTIFY_CLIENT_ID, SPOTIFY_PERMISSIONS, SPOTIFY_REDIRECT_URL} from './config';

const express = require('express');
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

app.listen(5000, () => {
  console.log('spotify-music-videos server listening on port 5000');
});
