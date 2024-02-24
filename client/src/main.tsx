import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { enableReactTracking } from '@legendapp/state/config/enableReactTracking';
// import {io} from './core/io/index.ts';
// import {connect} from "socket.io-client";
// export const socket = connect('http://localhost:4000')

enableReactTracking({
  auto: true,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
