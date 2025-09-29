const SearchResults = ({ tracks }) => {
  return (
    <ul>
      {tracks.map(track => (
        <li key={track.id}>
          <b>{track.name}</b> — {track.artists.map(a => a.name).join(', ')}
          {' '}
          <a href={track.external_urls.spotify} target="_blank" rel="noopener noreferrer">Spotify</a>
        </li>
      ))}
    </ul>
  );
};

export default SearchResults;
