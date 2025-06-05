import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

const store = configureStore({
  reducer: {
    auth: authReducer, // Kita bisa menambahkan reducer lain di sini jika ada
  },
});

export default store;