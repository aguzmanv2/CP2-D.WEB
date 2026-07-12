import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';
import './styles/variables.css';
import './styles/base.css';
import './styles/components/ui.css';
import './styles/components/crud.css';
import './styles/layouts/auth.css';
import './styles/layouts/dashboard.css';
import './styles/pages/auth.css';
import './styles/pages/dashboard.css';
import './styles/pages/reports.css';
import './styles/pages/turnos.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
