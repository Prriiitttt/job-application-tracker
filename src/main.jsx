import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

const root = createRoot(document.getElementById('root'))

const params = new URLSearchParams(window.location.search)
const harness = params.get('harness')

if (import.meta.env.DEV && harness === 'kanban') {
  // Dev-only test harness; dynamic import keeps it (and the heavy Applied page
  // it pulls in) out of the production bundle.
  import('./pages/_KanbanHarness.jsx').then(({ default: KanbanHarness }) => {
    root.render(
      <StrictMode>
        <KanbanHarness />
      </StrictMode>,
    )
  })
} else {
  root.render(
    <StrictMode>
      <ErrorBoundary scope="The application">
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
}
