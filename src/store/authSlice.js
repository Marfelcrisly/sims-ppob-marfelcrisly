// src/store/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('token') || null,
    isLoggedIn: !!localStorage.getItem('token'),
    user: null, // Data user akan disimpan di sini setelah login/mendapatkan profil
    balance: null, // Tambahkan state untuk saldo
  },
  reducers: {
    setLogin: (state, action) => {
      state.token = action.payload.token;
      state.isLoggedIn = true;
      localStorage.setItem('token', action.payload.token);
    },
    setLogout: (state) => {
      state.token = null;
      state.isLoggedIn = false;
      state.user = null;
      state.balance = null; // Reset saldo saat logout
      localStorage.removeItem('token');
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setBalance: (state, action) => { // TAMBAHKAN REDUCER INI
      state.balance = action.payload;
    },
  },
});

export const { setLogin, setLogout, setUser, setBalance } = authSlice.actions; // EKSPOR setBalance
export default authSlice.reducer;