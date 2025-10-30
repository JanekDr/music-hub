import { createSlice } from '@reduxjs/toolkit';

const playerSlice = createSlice({
  name: 'player',
  initialState: {
    queue: [],
    loading: false,
    spotifyToken: null,
    deviceId: null,
    currentTrackId: null,
    currentTrackIndex: null,
  },
  reducers: {
    setQueue: (state, action) => { state.queue = action.payload; },
    setLoading: (state, action) => { state.loading = action.payload; },
    setSpotifyToken: (state, action) => { state.spotifyToken = action.payload; },
    setDeviceId: (state, action) => { state.deviceId = action.payload; },
    setCurrentTrackId: (state, action) => { state.currentTrackId = action.payload; },
    setCurrentTrackIndex: (state, action) => { state.currentTrackIndex = action.payload; },
  }
});

export const {
  setQueue,
  setLoading,
  setSpotifyToken,
  setDeviceId,
  setCurrentTrackId,
  setCurrentTrackIndex
} = playerSlice.actions;

export default playerSlice.reducer;
