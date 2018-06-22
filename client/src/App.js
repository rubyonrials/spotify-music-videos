import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import PlaylistLineItem from './components/PlaylistLineItem';

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

    fetch((`${process.env.REACT_APP_BASE_API_URL}/playlists?accessToken=${accessToken}&userId=${userId}`), {
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
              <a href={`${process.env.REACT_APP_BASE_API_URL}/login`}>Log in</a>
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
