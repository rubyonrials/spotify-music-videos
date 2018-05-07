import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import {BASE_API_URL,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URL,
  SPOTIFY_PERMISSIONS} from './config';

class App extends Component {
  spotifyLogin() {
    const SPOTIFY_LOGIN_URL = 'https://accounts.spotify.com/authorize?' +
      'client_id=' + SPOTIFY_CLIENT_ID +
      '&response_type=code' +
      '&scope=' + encodeURIComponent(SPOTIFY_PERMISSIONS) +
      '&redirect_uri=' + encodeURIComponent(SPOTIFY_REDIRECT_URL);

    window.location.replace(SPOTIFY_LOGIN_URL);
  }

  exchangeCodeForToken() {
    const code = new URL(window.location.href).searchParams.get('code');
    console.log('code: ', code);

    if (code) {
      const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
      const bodyData = {
        code,
        redirect_uri: SPOTIFY_REDIRECT_URL,
        grant_type: 'authorization_code',
      };

      fetch(BASE_API_URL + '/spotify').then(response => console.log(response));
      // fetch(SPOTIFY_TOKEN_URL, {
      //   method: 'POST',
      //   mode: 'cors',
      //   credentials: 'include',
      //   headers: new Headers({
      //     'Authorization': 'Basic '+btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET),
      //   }),
      //   body: bodyData,
      // }).then(response => {
      //   // console.log('response: ' + response.json());
      //   return response.json();
      // }).catch(error => {
      //   console.log('error: ', error.message);
      // });
    }
  }

  render() {
    this.exchangeCodeForToken();

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to spotify-music-videos</h1>
        </header>
        <div className="App-intro">
          <p>First, log in to Spotify.</p>
          <a onClick={this.spotifyLogin}>Log in</a>
        </div>
      </div>
    );
  }
}

export default App;
