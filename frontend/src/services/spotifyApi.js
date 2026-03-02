import { api } from "./interceptors";

export const spotifyApi = {
  getSpotifyStatus: () => api.get("/spotify/user_status/"),
  disconnectSpotify: () => api.post("/spotify/disconnect/"),
  searchSpotifyTracks: (query) => api.get("/spotify/search/", { params: { q: query } }),
  getSpotifyToken: () => api.get("/spotify/token/"),
  getSpotifyPlaylists: () => api.get("/spotify/playlist/"),
  getPlaylistDetails: (playlistId) => api.get(`/spotify/playlist/${playlistId}`),
};

export default spotifyApi;
