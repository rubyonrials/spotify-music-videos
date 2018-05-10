import React, { Component } from 'react';
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
    }

    fetch((BASE_API_URL + '/playlists?accessToken=' + accessToken + '&userId=' + userId), {
      headers: {'content-type': 'application/json'},
    })
      .then(response => response.json())
      .then(response => {
        const playlists = response.items.map((playlist) => {
          return {id: playlist.id, name: playlist.name};
        });
        this.setState({playlists});
      })
      .catch((error) => {
        this.setState({error: error.message});
        // this.setState({accessToken: null, userId: null}));
      });
  }

  compilePlaylist = (event) => {
    const playlistId = event.target.dataset.id;
    console.log('target: ', event.target.dataset.id);

    fetch((BASE_API_URL +
      '/compile-playlist?accessToken=' + this.state.accessToken +
      '&playlistId=' + playlistId +
      '&userId=' + this.state.userId
    ), {
      headers: {'content-type': 'application/json'},
    })
      .then(response => response.json())
      .then(response => {
        console.log('compile playlist response: ', response);
      });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to spotify-music-videos</h1>
        </header>
        <div className="App-intro">
          <div>
            <p>First, log in to Spotify.</p>
            <a href={BASE_API_URL + '/login'}>Log in</a>
          </div>

          {this.state.error &&
            <p style={{color: 'red'}}>{this.state.error}</p>
          }

          {this.state.playlists &&
            <div>
              {this.state.playlists.map((playlist) => {
                return <a
                  key={playlist.id}
                  // href='#'
                  onClick={this.compilePlaylist}
                  data-id={playlist.id}
                  style={{display: 'block', margin: '10px'}}>
                  {playlist.name}
                </a>;
              })}
            </div>
          }
        </div>
      </div>
    );
  }
}

export default App;
