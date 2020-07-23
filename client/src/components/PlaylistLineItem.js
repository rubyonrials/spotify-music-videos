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

  render() {
    console.log('props');
    console.log(this.props);
    const {playlist} = this.props;
    const youtube = this.props.playlist.youtube;
    if (!youtube) return this.renderDefault();
    const youtubeIsEmpty = Object.keys(youtube).length === 0 && youtube.constructor === Object;
    if (youtubeIsEmpty) return this.renderDefault();

    return (
      <div className='playlist-li'>
        <span className="playlist">{playlist.name}</span>

        {youtube.loading && (
          <span className="loadingPlaylist">Generating music video playlist...</span>
        )}

        {!youtube.loading && youtube.url && (
          <a href={playlist.youtube.url} target='_blank' className="videoPlaylistLink">
            Watch music videos
          </a>
        )}
      </div>
    );
  }
}

export default PlaylistLineItem;
