import { api } from "./interceptors";

export const authAPI = {
  // auth
  register: (userData) => api.post("/users/register/", userData),
  login: (credentials) => api.post("/token/", credentials),
  logout: (refreshToken) => api.post("/users/logout/", { refresh_token: refreshToken }),
  getProfile: () => api.get("/users/profile/"),
  users: () => api.get("/users/"),

  // playlists
  createPlaylist: (data) => api.post("/playlist/", data),
  getUserPlaylists: () => api.get("/playlist/"),
  getUserPlaylist: (playlistId) => api.get(`/playlist/${playlistId}`),

  // queue
  getQueue: () => api.get("/queue/"),
  addToQueue: (trackId) => api.post("/queue/add_to_queue/", trackId),
  removeFromQueue: (queueTrackId) => api.delete("/queue/remove_from_queue/", queueTrackId),
  reorderQueue: (payload) => api.post("/queue/reorder_queue/", payload),
  addTrack: (data) => api.post("/tracks/add_track/", data),
};

export default authAPI;