// import { actions } from './actions'
import { init } from './core'

console.log('WE IN DA WORKER')

process.parentPort.on('message', (e) => {
  init(null, true).then(() => {
    const [port] = e.ports

    global.port = port

    port.on('message', (e) => {
      console.log(`Message from parent`)
      // if (e.data.jobType) {

      // }
    })
    port.start()

    port.postMessage({channel: 'pong', args: {}})
  })
})

// process.parentPort.on('message', (e) => {
//   // init(null, true).then(() => {
//     const [port] = e.ports

//     global.port = port

//     port.on('message', (e) => {
//       console.log(`Message from parent`)
//       // if (e.data.jobType) {

//       // }
//     })

//     port.on('telly', () => {
//       console.log('inna de telly')
//     })

//     port.start()
//   })
//   // port.postMessage('hello')
// // })
