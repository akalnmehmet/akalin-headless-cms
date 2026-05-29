import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
// highlight.js teması — prose içinde pre code bloklarını renklendirir
import 'highlight.js/styles/github-dark.min.css'
// i18n — react-i18next başlatma (App'den önce import edilmeli)
import './i18n'
import App from './App.tsx'

// Sentry hata takibi — VITE_SENTRY_DSN env tanımlıysa etkinleşir
const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
