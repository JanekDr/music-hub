import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './playerSlice.js';

const store = configureStore({
  reducer: {
    player: playerReducer,
  },
});

export default store;
