import React from 'react'
import ReactDOM from 'react-dom/client'
//import App from '/var/www/student-votes/frontend/App'
import App from '../App' // Ensure this path is correct
import './index.css'


const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
