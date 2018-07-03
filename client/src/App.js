import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import PlaylistLineItem from './components/PlaylistLineItem';

const BASE_API_URL = 'http://localhost:5000';
const params = new URL(window.location.href).searchParams;

class App extends Component {
  constructor(props) {
    super(props);

    const spotifyAccessToken = this.getParam('spotifyAccessToken');
    const spotifyUserId = this.getParam('spotifyUserId');
    const youtubeAccessToken = this.getParam('youtubeAccessToken');
    const error = params.get('error');

    this.state = {
      spotify: {
        accessToken: spotifyAccessToken,
        userId: spotifyUserId,
      },
      youtube: {
        accessToken: youtubeAccessToken,
      },
      error,
    };

    if (spotifyAccessToken && spotifyUserId) {
      this.fetchSpotifyPlaylists();
    }
  }

  getParam = (key) => {
    const urlParam = params.get(key);
    if (urlParam) {
      sessionStorage.setItem(key, urlParam);
      return urlParam;
    }

    return sessionStorage.getItem(key);
  }

  fetchSpotifyPlaylists = () => {
    const {accessToken, userId} = this.state.spotify;

    fetch((`${BASE_API_URL}/spotify-playlists?accessToken=${accessToken}&userId=${userId}`), {
      headers: {'content-type': 'application/json'},
    })
      .then(response => response.json())
      .then((response) => {
        if (response.error) {
          throw new Error(response.error);
        }

        const playlists = response.items.map(playlist => (
          {id: playlist.id, name: playlist.name}
        ));
        this.setState({playlists});
      })
      .catch((error) => {
        this.setState({accessToken: null, userId: null, error: error.message});
      });
  }

  render() {
    const {userId, accessToken, playlists, error} = this.state;

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to spotify-music-videos</h1>
        </header>
        <div className="App-intro">
          {!(userId && accessToken) &&
            <div>
              <p>Step 1: Log in to Spotify</p>
              <a href={`${BASE_API_URL}/spotify-login`}>Log in</a>
            </div>
          }

          {error &&
            <p style={{color: 'red'}}>{error}</p>
          }

          {playlists &&
            <div>
              <p>Step 2: Select a playlist</p>
              {playlists.map(playlist =>
                <PlaylistLineItem
                  key={playlist.id}
                  playlist={playlist}
                  accessToken={accessToken}
                  userId={userId}
                />)}
            </div>
          }
        </div>
      </div>
    );
  }
}

export default App;
