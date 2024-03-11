import 'react-tooltip/dist/react-tooltip.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { enableReactTracking } from '@legendapp/state/config/enableReactTracking';
import {connect} from "socket.io-client";
import { handleTaskQueueEvent } from './core/io/taskqueue.ts';
import { handleApolloEvent, handleApolloProcessQueueEvents} from './core/io/apollo.ts';
import { handleAPromptEvents } from './core/io/prompt.ts'

enableReactTracking({
  auto: true,
});

export const io = connect('http://localhost:4000')

io.on('apollo', handleApolloEvent)
io.on('taskQueue', handleTaskQueueEvent)
io.on('processQueue', handleApolloProcessQueueEvents)
io.on('prompt', handleAPromptEvents)

ReactDOM.createRoot(document.getElementById('root')!).render(
<App />,
)

