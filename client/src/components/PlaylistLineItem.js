import React, {Component, Props} from 'react';
import '../App.css';

class PlaylistLineItem extends Component<Props> {
  renderDefault() {
    const {playlist} = this.props;

    return (
      <a
        href='#'
        onClick={this.props.compilePlaylist}
        data-id={playlist.id}
        data-name={playlist.name}
        style={{display: 'block', margin: '10px'}}>
        {playlist.name}
      </a>
    );
  }

  renderLoading() {
    const {playlist} = this.props;

    return (
      <div>
        <span style={{margin: '10px'}}>{playlist.name}</span>
        <span className="loadingPlaylist">Generating music video playlist...</span>
      </div>
    );
  }

  renderComplete() {
    const {playlist} = this.props;

    return (
      <div>
        <span style={{margin: '10px'}}>{playlist.name}</span>
        <a href={playlist.youtube.url} target='_blank' className="videoPlaylistLink">
          Watch music videos
        </a>
      </div>
    );
  }

  render() {
    const youtube = this.props.playlist.youtube;

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
