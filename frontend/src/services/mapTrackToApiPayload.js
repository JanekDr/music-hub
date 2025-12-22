export const mapTrackToApiPayload = (track, platformOverride = null) => {
  if (!track) return null;
  const platform = platformOverride || track.platform;

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
  }

  if (platform === 'soundcloud') {
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

  return {
      track_id: track.id || track.track_id,
      name: track.name,
      author: track.author,
      url: track.url,
      image_url: track.image_url,
      track_duration: track.track_duration,
      platform: platform || 'unknown'
  };
};