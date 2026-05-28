import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// highlight.js teması — prose içinde pre code bloklarını renklendirir
import 'highlight.js/styles/github-dark.min.css'
// i18n — react-i18next başlatma (App'den önce import edilmeli)
import './i18n'
import App from './App.tsx'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
