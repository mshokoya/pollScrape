import './assets/main.css'
import 'react-tooltip/dist/react-tooltip.css'
import '@radix-ui/themes/styles.css'
import ReactDOM from 'react-dom/client'
import App from './App'
// import './index.css'
import { enableReactTracking } from '@legendapp/state/config/enableReactTracking'
import { handleTaskQueueEvent } from './core/io/taskqueue'
import { handleApolloEvent, handleApolloProcessQueueEvents } from './core/io/apollo'
import { handleAPromptEvents } from './core/io/prompt'

enableReactTracking({
  auto: true
})

window.ipc.on('apollo', handleApolloEvent)
window.ipc.on('taskQueue', handleTaskQueueEvent)
window.ipc.on('processQueue', handleApolloProcessQueueEvents)
window.ipc.on('prompt', handleAPromptEvents)

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
