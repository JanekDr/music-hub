export const mapTrackToApiPayload = (track) => {
  if (!track) return null;

  if (track.platform !== undefined){
    return {
      track_id: track.track_id,
      name: track.name,
      author: track.author,
      url: track.url,
      image_url: track.image_url,
      track_duration: track.track_duration,
      platform: track.platform
    }
  }

  const platform = track.uri.startsWith('spotify') ? "spotify" : "soundcloud";

  if (platform === 'spotify') {
    return {
      track_id: track.id,
      name: track.name,
      author: track.artists ? track.artists.map(a => a.name).join(', ') : 'Unknown Artist',
      url: track.uri,
      image_url: track.album?.images?.[0]?.url || '',
      track_duration: track.duration_ms,
      platform: 'spotify'
    };
  } else {
    return {
      track_id: String(track.id),
      name: track.title,
      author: track.user?.username || 'Unknown Artist',
      url: track.uri || track.permalink_url,
      image_url: track.artwork_url || track.user?.avatar_url || '',
      track_duration: track.duration,
      platform: 'soundcloud'
    };
  }
};