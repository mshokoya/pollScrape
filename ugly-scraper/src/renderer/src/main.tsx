import './assets/main.css'
import 'react-tooltip/dist/react-tooltip.css'
import '@radix-ui/themes/styles.css'
import 'reactflow/dist/style.css'
import { createRoot } from 'react-dom/client'
import App from './App'
// import './index.css'
import { enableReactTracking } from '@legendapp/state/config/enableReactTracking'
import { handleProcessQueueEvent, handleTaskQueueEvent } from './core/io/taskqueue'
import { handleAPromptEvents } from './core/io/prompt'
import { handleApolloScrapeEndEvent } from './core/io/apollo'
import { QUEUE_CHANNELS as QC } from '../../shared/util'
import { handleScrapeProcessQueueEvent, handleScrapeQueueEvent } from './core/io/scrapequeue'
import { handleForkEvent } from './core/io/forks'

enableReactTracking({
  auto: true
})

window.ipc.on('apollo', handleApolloScrapeEndEvent)
window.ipc.on(QC.taskQueue, handleTaskQueueEvent)
window.ipc.on(QC.processQueue, handleProcessQueueEvent)
window.ipc.on(QC.scrapeQueue, handleScrapeQueueEvent)
window.ipc.on(QC.scrapeProcessQueue, handleScrapeProcessQueueEvent)
window.ipc.on('prompt', handleAPromptEvents)
window.ipc.on('fork', handleForkEvent)

createRoot(document.getElementById('root')!).render(<App />)
