import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/base.css'
import './styles/figures.css'
import './styles/home.css'
import './styles/day.css'
import './styles/blocks.css'
import './styles/video.css'
import './styles/search.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
