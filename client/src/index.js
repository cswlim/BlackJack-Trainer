import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // Corrected to import from App.js

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
