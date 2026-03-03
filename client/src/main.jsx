import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

axios.defaults.withCredentials = true;
// Since we use the proxy in vite.config.js, we don't need to set baseURL here, 
// but it's good practice to ensure credentials are sent.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
