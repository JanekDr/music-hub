import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('accessToken', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Funkcje API
export const authAPI = {
  register: (userData) => api.post('/users/register/', userData),
  login: (credentials) => api.post('/token/', credentials),
  logout: (refreshToken) => api.post('/users/logout/', { refresh_token: refreshToken }),
  getProfile: () => api.get('/users/profile/'),
  getSpotifyStatus: () => api.get('/spotify/user_status/'),
  postSpotifyDisconnect: () => api.post('/spotify/disconnect/'),
  searchTracks: (query) => api.get('/spotify/search/', {params: { q: query} }),
  getSpotifyToken: () => api.get('/spotify/token/'),
  getSpotifyPlaylists: () => api.get('/spotify/playlist/'),
  users: () => api.get('/users/'),
  createPlaylist: (data) => api.post('/playlist/', data),
  getUserPlaylists: () => api.get('/playlist/'),
  getQueue: () => api.get('/queue/'),
  addToQueue: (trackId) => api.post('/queue/add_to_queue/', trackId),
  removeFromQueue: (queueTrackId) => api.delete('/queue/remove_from_queue/', queueTrackId),
  moveTrackQueue: (trackId, targetTrackId) => api.post('/queue/move_track_relative/', trackId, targetTrackId),
};

export default api;
