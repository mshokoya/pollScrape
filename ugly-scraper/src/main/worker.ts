// import { actions } from './actions'
import { init } from './core'

console.log('WE IN DA WORKER')

// process.parentPort.on('message', (evt) => {
//   console.log('mmaaiinn')
//   console.log(evt)
//   console.log(ipcMain)
// })

// export const worker = (evt) => {

//   console.log('mmaaiinn')
//   console.log(evt)
//   console.log(ipcMain)

//   // const action = actions[evt.data.jobType]

//   // if (!action) {}
// }

// fork.ts
process.parentPort.on('message', (e) => {
  init().then(() => {
    const [port] = e.ports
    port.on('message', (e) => {
      console.log(`Message from parent: ${e.data}`)
      // console.log(ipcMain)
    })
    port.start()
  })
  
  // port.postMessage('hello')
})
