import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Starfield from './ui/Starfield.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Starfield />
    <App />
  </StrictMode>,
)
