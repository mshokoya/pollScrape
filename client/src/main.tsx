// import {TaskQueueSocketEvent} from './core/io/index.ts'; 
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { enableReactTracking } from '@legendapp/state/config/enableReactTracking';
import {connect} from "socket.io-client";
import { TaskQueueSocketEvent, handleTaskQueueEvent } from './core/io/taskqueue.ts';
import { handleApolloEvent, handleApolloProcessQueueEvents, handleApolloTaskQueueEvents } from './core/io/apollo.ts';

enableReactTracking({
  auto: true,
});

export const io = connect('http://localhost:4000')

io.on('apollo', handleApolloEvent)
io.on('taskQueue', handleTaskQueueEvent)
io.on('processQueue', handleApolloProcessQueueEvents)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

