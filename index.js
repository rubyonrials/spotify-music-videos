import express from 'express';
import querystring from 'querystring';
import request from 'request';
import {google} from 'googleapis';
import util from 'util';
import path from 'path';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

const SPOTIFY_PERMISSIONS = ['user-library-read', 'playlist-read-collaborative', 'playlist-read-private'];

const youtubeAuth = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  'http://localhost:3000/youtube-login-callback',
);

youtubeAuth.setCredentials({
  access_token: process.env.YOUTUBE_ACCESS_TOKEN,
  refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
});

const youtube = google.youtube({
  version: 'v3',
  auth: youtubeAuth,
});

function makeRequest(requestData) {
  return new Promise((resolve, reject) => {
    request(requestData, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        resolve(body);
      } else {
        console.log(`Error while making request: ${requestData.method} ${requestData.url}`);

        if(error) {
          console.log('E1: ', error);
          reject(error);
        } else if(body.error_description) {
          console.log('E2: ', body.error_description);
          reject(body.error_description);
        } else if(body.error) {
          console.log(`E3: ${body.error.status} ${body.error.message}`);
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
  const requestData = {
    url: 'https://accounts.spotify.com/api/token',
    method: 'POST',
    form: {
      code: code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URL,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
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
    url: `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks?fields=total,limit,items.track(name,artists(name))`,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + (accessToken.toString('base64'))
    },
    json: true
  };

  const requestResponse = await makeRequest(requestData);
  return requestResponse.items.map((track) => {
    return {
      trackName: track.track.name,
      artistName: track.track.artists[0].name
    };
  });
}

async function searchYoutube(track) {
  const res = await youtube.search.list({
    part: 'id,snippet',
    q: `${track.trackName} ${track.artistName} music video`,
    maxResults: 3,
    type: 'video',
  });
  return res.data.items[0].id.videoId;
}

async function getYoutubeVideoIds(tracks) {
  return await Promise.all(
    tracks.map(async (track) => await searchYoutube(track))
  );
}

async function createYoutubePlaylist(playlistName) {
  try {
    const res = await youtube.playlists.insert({
      part: 'snippet,status',
      resource: {
        snippet: {
          title: `Music videos: ${playlistName}`,
          description: 'A playlist created by spotify-music-videos',
        },
        status: {
          privacyStatus: 'unlisted',
        },
      },
    });

    return res.data.id;
  } catch(error) {
    return process.env.YOUTUBE_DEFAULT_PLAYLIST_ID;
  }
}

function addToYoutubePlaylist(playlistId, videoId) {
  youtube.playlistItems.insert({
    part: 'snippet',
    resource: {
      snippet: {
        playlistId,
        resourceId: {
          videoId,
          kind: 'youtube#video'
        }
      }
    }
  });
}

// TODO: speed this up. dont wait 600, wait until previous execution finishes
async function insertVideosIntoPlaylist(playlistId, videoIds) {
  let index = 0;

  // use for, await before incrementing

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if(index == videoIds.length) {
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
  const videoIds = await getYoutubeVideoIds(tracks);
  const playlistId = await createYoutubePlaylist(playlistName);
  await insertVideosIntoPlaylist(playlistId, videoIds);

  return `https://www.youtube.com/watch?list=${playlistId}&v=${videoIds[0]}`;
}

const app = express();

app.use(express.static(path.join(__dirname, '..', 'client/build')));

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
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: SPOTIFY_PERMISSIONS,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URL,
    }));
});

app.get('/login-callback', async (req, res) => {
  const code = req.query.code;
  if(!code) {
    return res.redirect(process.env.BASE_UI_URL + '?' + querystring.stringify({error: 'code_missing'}));
  }

  try {
    const {access_token: accessToken, refresh_token: refreshToken} = await getAuthTokens(code);
    const {id: userId} = await getUserId(accessToken);

    res.redirect(process.env.BASE_UI_URL + '?' +
      querystring.stringify({
        accessToken,
        refreshToken,
        userId,
      }));
  } catch(error) {
    res.redirect(process.env.BASE_UI_URL + '?' + querystring.stringify({error}));
  }
});

app.get('/playlists', async (req, res) => {
  const accessToken = req.query.accessToken;
  const offset = req.query.offset || 0;
  if(!accessToken || accessToken === '') {
    return res.redirect(process.env.BASE_UI_URL + '?' + querystring.stringify({error: 'access_token_missing'}));
  }

  try {
    const playlists = await getPlaylists(accessToken, offset);
    res.json(playlists);
  } catch(error) {
    res.json({error});
  }
});

app.get('/compile-playlist', async (req, res) => {
  const accessToken = req.query.accessToken;
  const userId = req.query.userId;
  const playlistId = req.query.playlistId;
  const playlistName = req.query.playlistName;

  if(!accessToken || !userId || !playlistId || !playlistName) {
    return res.json({error: 'params_missing'});
  }

  try {
    const tracks = await getTracks(accessToken, userId, playlistId);
    const youtubePlaylistUrl = await makeYoutubePlaylist(tracks, playlistName);
    res.json(youtubePlaylistUrl);
  } catch(error) {
    res.json({error});
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
// good spinner that shoes each video being added
// detect non music videos
// save accesstoken, userid in local storage
