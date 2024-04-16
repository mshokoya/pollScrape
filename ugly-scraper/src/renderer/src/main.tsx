import './assets/main.css'
import 'react-tooltip/dist/react-tooltip.css'
import '@radix-ui/themes/styles.css'
import { createRoot } from 'react-dom/client'
import App from './App'
// import './index.css'
import { enableReactTracking } from '@legendapp/state/config/enableReactTracking'
import { handleProcessQueueEvent, handleTaskQueueEvent } from './core/io/taskqueue'
import { handleAPromptEvents } from './core/io/prompt'
import { handleApolloScrapeEndEvent } from './core/io/apollo'

enableReactTracking({
  auto: true
})

window.ipc.on('apollo', handleApolloScrapeEndEvent)
window.ipc.on('taskQueue', handleTaskQueueEvent)
window.ipc.on('processQueue', handleProcessQueueEvent)
window.ipc.on('prompt', handleAPromptEvents)

createRoot(document.getElementById('root')!).render(<App />)
