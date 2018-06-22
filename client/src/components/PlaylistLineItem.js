import React, {Component, Props} from 'react';
import '../App.css';

class PlaylistLineItem extends Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
      playlist: props.playlist,
    };
  }

  compilePlaylist = (event) => {
    const playlistId = event.target.dataset.id;
    const playlistName = event.target.dataset.name;
    const {userId, accessToken} = this.props;

    this.setState({
      playlist: {
        ...this.state.playlist,
        youtube: {
          loading: true,
        },
      },
    });

    fetch((process.env.REACT_APP_BASE_API_URL + '/compile-playlist?' +
      'accessToken=' + accessToken +
      '&playlistId=' + playlistId +
      '&userId=' + userId +
      '&playlistName=' + playlistName
    ), {
      headers: {'content-type': 'application/json'},
    })
      .then(response => response.json())
      .then((response) => {
        this.setState({
          playlist: {
            ...this.state.playlist,
            youtube: {
              loading: false,
              url: response,
            },
          },
        });
      })
      .catch((error) => {
        this.setState({error: error.message});
      });
  }

  renderDefault() {
    const {playlist} = this.state;

    return (
      <a
        href='#'
        onClick={this.compilePlaylist}
        data-id={playlist.id}
        data-name={playlist.name}
        style={{display: 'block', margin: '10px'}}>
        {playlist.name}
      </a>
    );
  }

  renderLoading() {
    const {playlist} = this.state;

    return (
      <div>
        <span style={{margin: '10px'}}>{playlist.name}</span>
        <span>Generating music video playlist...</span>
      </div>
    );
  }

  renderComplete() {
    const {playlist} = this.state;

    return (
      <div>
        <span style={{margin: '10px'}}>{playlist.name}</span>
        <a href={playlist.youtube.url} target='_blank'>
          Watch music videos
        </a>
      </div>
    );
  }

  render() {
    const youtube = this.state.playlist.youtube;

    if (youtube) {
      if (youtube.loading) {
        return this.renderLoading();
      } else if (youtube.url) {
        return this.renderComplete();
      }
    }

    return this.renderDefault();
  }
}

export default PlaylistLineItem;
