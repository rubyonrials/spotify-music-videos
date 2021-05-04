import express from 'express';
import querystring from 'querystring';
import request from 'request';
import {google} from 'googleapis';
import path from 'path';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

const SPOTIFY_PERMISSIONS = ['playlist-read-private'];

const youtubeAuth = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URL,
);

youtubeAuth.setCredentials({
  refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
});

const youtube = google.youtube({
  version: 'v3',
  auth: youtubeAuth,
});

function makeRequest(requestData) {
  return new Promise((resolve, reject) => {
    request(requestData, (error, response, body) => {
      // console.log('--- RESPONSE ---');
      // console.log(error);
      // console.log(response);
      // console.log(body);
      // console.log('--- END RESPONSE ---');
      if (!error && response.statusCode === 200) {
        resolve(body);
      } else {
        console.log(`Error while making request: ${requestData.method} ${requestData.url}`);

        if (error) {
          console.log('E1: ', error);
          reject(error);
        } else if (body.error_description) {
          console.log('E2: ', body.error_description);
          reject(body.error_description);
        } else if (body.error) {
          console.log(`E3: ${body.error.status} ${body.error.message}`);
          reject(body.error.message);
        } else {
          console.log('E4: ', body);
          reject(new Error('unknown error'));
        }
      }
    });
  });
}

function getAuthTokens(code) {
  const requestData = {
    url: 'https://accounts.spotify.com/api/token',
    method: 'POST',
    form: {
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URL,
      grant_type: 'authorization_code',
    },
    headers: {
      Authorization: 'Basic ' + (Buffer.from(
        process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET,
      ).toString('base64')),
    },
    json: true,
  };
  return makeRequest(requestData);
}

function getUserId(accessToken) {
  const requestData = {
    url: 'https://api.spotify.com/v1/me',
    method: 'GET',
    headers: {Authorization: 'Bearer ' + accessToken},
    json: true,
  };
  return makeRequest(requestData);
}

function getSpotifyPlaylists(accessToken, userId, offset) {
  const requestData = {
    url: `https://api.spotify.com/v1/users/${userId}/playlists?limit=50&offset=${offset}`,
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + (accessToken.toString('base64')),
    },
    json: true,
  };
  return makeRequest(requestData);
}

async function getTracks(accessToken, userId, playlistId) {
  const requestData = {
    url: `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks?fields=total,limit,items.track(name,artists(name))`,
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + (accessToken.toString('base64')),
    },
    json: true,
  };
  // console.log('--- GET TRACKS ---');
  // console.log(requestData);

  const requestResponse = await makeRequest(requestData);
  return requestResponse.items.map(track => ({
    trackName: track.track.name,
    artistName: track.track.artists[0].name,
  }));
}

function looksLikeMusicVideo(item) {
  // console.log('search result');
  // console.log(item);

  const OFFICIAL = 'official';
  const VIDEO = 'video';
  const VEVO = 'VEVO';
  const LYRIC = 'lyric';

  const {title, channelTitle} = item.snippet;
  const lTitle = title.toLowerCase();
  const lChannelTitle = channelTitle.toLowerCase();

  return channelTitle.includes(VEVO) ||
    (lChannelTitle.includes(OFFICIAL) && lChannelTitle.includes(VIDEO) && !lChannelTitle.includes(LYRIC)) ||
    (lTitle.includes(OFFICIAL) && lTitle.includes(VIDEO) && !lTitle.includes(LYRIC));
}

async function searchYoutube(track) {
  const res = await youtube.search.list({
    part: 'id,snippet',
    q: `${track.trackName} ${track.artistName} official music video`,
    maxResults: 3,
    type: 'video',
  });

  const musicVideo = res.data.items.find(item => looksLikeMusicVideo(item));
  return musicVideo ? musicVideo.id.videoId : null;
}

async function getYoutubeVideoIds(tracks) {
  return (await Promise.all(tracks.map(track => searchYoutube(track)))).filter(track => track);
}

async function makeYoutubePlaylist(tracks) {
  const videoIds = await getYoutubeVideoIds(tracks);
  return `https://www.youtube.com/watch_videos?video_ids=${videoIds.join()}`;
}

const app = express();

app.use(express.static(path.join(__dirname, '..', 'client/build')));

app.use((req, res, next) => {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  // Request headers you wish to allow
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  // Pass to next layer of middleware
  next();
});

app.get('/spotify-login', (req, res) => {
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: SPOTIFY_PERMISSIONS,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URL,
    }));
});

app.get('/spotify-login-callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.redirect(process.env.BASE_UI_URL + '?' + querystring.stringify({error: 'code_missing'}));
  }

  try {
    const resp = await getAuthTokens(code);
    // console.log('----SPOTIFY LOGIN CALLBACK----');
    // console.log(resp);
    const {
      access_token: spotifyAccessToken,
      refresh_token: spotifyRefreshToken,
    } = resp;
    const {id: spotifyUserId} = await getUserId(spotifyAccessToken);

    return res.redirect(process.env.BASE_UI_URL + '?' +
      querystring.stringify({
        spotifyAccessToken,
        spotifyRefreshToken,
        spotifyUserId,
      }));
  } catch (error) {
    return res.redirect(process.env.BASE_UI_URL + '?' + querystring.stringify({error}));
  }
});

app.get('/spotify-playlists', async (req, res) => {
  const accessToken = req.query.accessToken;
  const userId = req.query.userId;
  const offset = req.query.offset || 0; // query.offset is not passed yet
  if (!accessToken || accessToken === '') {
    return res.json({error: 'access_token_missing'});
  }

  try {
    return res.json(await getSpotifyPlaylists(accessToken, userId, offset));
  } catch (error) {
    return res.json({error});
  }
});

app.get('/compile-playlist', async (req, res) => {
  const accessToken = req.query.accessToken;
  const userId = req.query.userId;
  const playlistId = req.query.playlistId;

  if (!accessToken || !userId || !playlistId) {
    return res.json({error: 'params_missing'});
  }

  try {
    const tracks = await getTracks(accessToken, userId, playlistId);
    // console.log('--- GOT TRACKS ---');
    // console.log(tracks);
    const youtubePlaylistUrl = await makeYoutubePlaylist(tracks);
    return res.json(youtubePlaylistUrl);
  } catch (error) {
    console.log('Server error:');
    console.log(error);
    return res.json({error: "Oops! The site messed up (code 001)."});
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '/client/build/index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('spotify-music-videos server listening on port ', port);
});

// dont request all parts of tracks artist for playlist
// catch expired token, other error handling
// good spinner that shows each video being added
// timeouts for huge playlists
