import express from 'express';
import socketIO from 'socket.io';
import {createServer} from 'node:http';
import {scraper} from './scraper';

const app = express();
const server = createServer();
const io = socketIO(server);

//  free proxies
// https://proxyscrape.com/free-proxy-list


io.on('connection', (socket) => {
  console.log('A user connected');
  
  socket.on('message', (data) => {
    console.log(`Received message: ${data}`);
      //The received message is broadcasted to all connected clients using the emit() method of the io object.
    io.emit('message', data);
  });
  //an event listener is set up for when a client disconnects.
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });

});


app.post('/apollo', async (req, res) => {
  

  res.json({
    ok: true,
    data: {
      message: "hello world"
    }
  })
});

server.listen(4000, () => {
  console.log('connected to server on port 4000')
})