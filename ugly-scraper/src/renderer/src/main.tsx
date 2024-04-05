import './assets/main.css'
import 'react-tooltip/dist/react-tooltip.css'
import '@radix-ui/themes/styles.css';
import ReactDOM from 'react-dom/client'
import App from './App'
// import './index.css'
import { enableReactTracking } from '@legendapp/state/config/enableReactTracking';
// import {connect} from "socket.io-client";
// import { handleTaskQueueEvent } from './core/io/taskqueue.ts';
// import { handleApolloEvent, handleApolloProcessQueueEvents} from './core/io/apollo.ts';
// import { handleAPromptEvents } from './core/io/prompt.ts'


enableReactTracking({
  auto: true
})

// export const io = connect('http://localhost:4000')

// io.on('apollo', handleApolloEvent)
// io.on('taskQueue', handleTaskQueueEvent)
// io.on('processQueue', handleApolloProcessQueueEvents)
// io.on('prompt', handleAPromptEvents)

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)

// import './assets/main.css'

// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './App'

// ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// )
