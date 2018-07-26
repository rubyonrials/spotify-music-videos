export const BASE_API_URL = process.env.REACT_APP_BASE_API_URL || '';

export const emptyState = {
  spotify: {},
  youtube: {},
  playlists: [],
};

export const emptyCredentialsState = {
  spotify: {},
  youtube: {},
};

export async function compilePlaylist(event) {
  const setPlaylistLoading = playlistsIndex => (
    new Promise((resolve) => {
      const newPlaylists = this.state.playlists.slice();

      newPlaylists[playlistsIndex] = {
        ...newPlaylists[playlistsIndex],
        youtube: {
          loading: true,
        },
      };

      this.setState({playlists: newPlaylists}, resolve);
    })
  );

  const playlistId = event.target.dataset.id;
  const playlistName = event.target.dataset.name;
  const playlistsIndex = this.state.playlists.findIndex(e => e.id === playlistId);
  const {userId, accessToken} = this.state.spotify;

  await setPlaylistLoading(playlistsIndex);

  fetch((BASE_API_URL + '/compile-playlist?' +
    'accessToken=' + accessToken +
    '&playlistId=' + playlistId +
    '&userId=' + userId +
    '&playlistName=' + playlistName
  ), {
    headers: {'content-type': 'application/json'},
  })
    .then(response => response.json())
    .then((response) => {
      if (response.error) { throw new Error(response.error); }

      const newPlaylists = this.state.playlists.slice();

      newPlaylists[playlistsIndex] = {
        ...newPlaylists[playlistsIndex],
        youtube: {
          loading: false,
          url: response,
        },
      };
      this.setState({playlists: newPlaylists});
    })
    .catch((error) => {
      this.setState({error: error.message});
    });
}

export function fetchSpotifyPlaylists() {
  const {accessToken, userId} = this.state.spotify;
  if (!accessToken || !userId) { return; }

  fetch((`${BASE_API_URL}/spotify-playlists?accessToken=${accessToken}&userId=${userId}`), {
    headers: {'content-type': 'application/json'},
  })
    .then(response => response.json())
    .then((response) => {
      if (response.error) { throw new Error(response.error); }

      const playlists = response.items.map(playlist => (
        {id: playlist.id, name: playlist.name}
      ));

      const dedupedPlaylists = playlists.filter(playlist => (
        this.state.playlists.find(sp => sp.id === playlist.id) === undefined
      ));

      this.setState({
        playlists: [
          ...this.state.playlists,
          ...dedupedPlaylists,
        ],
      });
    })
    .catch((error) => {
      this.setState(Object.assign(emptyCredentialsState, {error: error.message}));
    });
}
