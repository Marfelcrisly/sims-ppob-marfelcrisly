import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Anda bisa mengosongkan ini atau menambah styling global jika perlu
import App from './App';
import { Provider } from 'react-redux';
import store from './store'; // Import store yang telah kita buat

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);