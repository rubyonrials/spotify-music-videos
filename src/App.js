import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import {BASE_API_URL} from './config';

class App extends Component {
  constructor(props) {
    super(props);

    const params = new URL(window.location.href).searchParams;
    const accessToken = params.get('accessToken');
    const userId = params.get('userId');
    const error = params.get('error');

    this.state = {
      accessToken,
      userId,
      error,
    };

    if (accessToken && userId) {
      this.fetchPlaylists();
    }
  }

  fetchPlaylists = () => {
    const {accessToken, userId} = this.state;

    fetch((`${BASE_API_URL}/playlists?accessToken=${accessToken}&userId=${userId}`), {
      headers: {'content-type': 'application/json'},
    })
      .then(response => response.json())
      .then((response) => {
        if (response.error) {
          throw new Error(response.error);
        }

        const playlists = response.items.map(playlist => ({id: playlist.id, name: playlist.name}));
        this.setState({playlists});
      })
      .catch((error) => {
        this.setState({accessToken: null, userId: null, error: error.message});
      });
  }

  compilePlaylist = (event) => {
    const playlistId = event.target.dataset.id;
    const playlistName = event.target.dataset.name;
    const {userId, accessToken} = this.state;

    fetch((`${BASE_API_URL}/compile-playlist?
      accessToken=${accessToken}
      &playlistId=${playlistId}
      &userId=${userId}
      &playlistName=${playlistName}`
    ), {
      headers: {'content-type': 'application/json'},
    })
      .then(response => response.json())
      .then((response) => {
        console.log('compile playlist response: ', response);
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
              <a href={`${BASE_API_URL}/login`}>Log in</a>
            </div>
          }

          {error &&
            <p style={{color: 'red'}}>{error}</p>
          }

          {playlists &&
            <div>
              <p>Step 2: Select a playlist</p>
              {playlists.map(playlist =>
                <a
                  key={playlist.id}
                  href='#'
                  onClick={this.compilePlaylist}
                  data-id={playlist.id}
                  data-name={playlist.name}
                  style={{display: 'block', margin: '10px'}}>
                  {playlist.name}
                </a>)}
            </div>
          }
        </div>
      </div>
    );
  }
}

export default App;
