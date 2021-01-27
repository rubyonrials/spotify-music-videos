import React, {Component} from 'react';
import './App.css';
import PlaylistLineItem from './components/PlaylistLineItem';
import {loadState, saveState} from './util';
import {
  BASE_API_URL,
  emptyState,
  compilePlaylist,
  fetchSpotifyPlaylists,
} from './actions';

const params = new URL(window.location.href).searchParams;

class App extends Component {
  constructor(props) {
    super(props);
    this.fetchSpotifyPlaylists = fetchSpotifyPlaylists.bind(this);
    this.compilePlaylist = compilePlaylist.bind(this);

    // First try to load state from localStorage, and overwrite with param values, if they exist
    this.state = loadState() || emptyState;

    const spotifyAccessToken = params.get('spotifyAccessToken');
    const spotifyUserId = params.get('spotifyUserId');
    const youtubeAccessToken = params.get('youtubeAccessToken');
    const error = params.get('error');

    if (spotifyAccessToken) { this.state.spotify.accessToken = spotifyAccessToken; }
    if (spotifyUserId) { this.state.spotify.userId = spotifyUserId; }
    if (youtubeAccessToken) { this.state.youtube.accessToken = youtubeAccessToken; }
    if (error) { this.state.error = error; }

    this.fetchSpotifyPlaylists();
  }

  componentDidUpdate() {
    const backupState = Object.assign({}, this.state);

    delete (backupState.error);

    // don't save youtube loading state
    backupState.playlists.forEach((playlist) => {
      if (playlist.youtube) {
        delete (playlist.youtube.loading);
      }
    });

    saveState(backupState);
  }

  render() {
    const {spotify, playlists, error} = this.state;

    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">
            spotify music videos
          </h1>
          <p>
            Created specifically for you by&nbsp;
            <a href='https://github.com/rubyonrials'
              target='_blank' rel='noopener noreferrer'>
              Matt
            </a>
          </p>
          <p className='youtube-disclaimer'>
            By using this tool, you acknowledge that this app uses YouTube API Services, and agree to the
            &nbsp;
            <a href='https://www.youtube.com/t/terms' target='_blank' rel='noopener noreferrer'>
              YouTube ToS
            </a>
            &nbsp;and&nbsp;
            <a href='https://policies.google.com/privacy' target='_blank' rel='noopener noreferrer'>
              Google privacy policy
            </a>
            .&nbsp;
            <span className='youtube-disclaimer-important'>
              NO ACCESS TO YOUR YOUTUBE ACCOUNT IS NEEDED
            </span>.
          </p>
        </header>
        <div className="App-content">
          {Object.keys(spotify).length === 0 &&
            <div>
              <p className="App-instruction">Step 1: Log in to Spotify</p>
              <a href={`${BASE_API_URL}/spotify-login`}>Log in</a>
            </div>
          }

          {error && (
            <div className="error">
              <span>{error}</span>
              <span>Please try again, or contact Matt.</span>
            </div>
          )}

          {Object.keys(spotify).length !== 0 && playlists.length > 0 &&
            <React.Fragment>
              <p className="App-instruction">Step 2: Select a playlist</p>
              {playlists.map(playlist =>
                <PlaylistLineItem
                  key={playlist.id}
                  playlist={playlist}
                  compilePlaylist={this.compilePlaylist}
                />)}
            </React.Fragment>
          }
        </div>
      </div>
    );
  }
}

export default App;
