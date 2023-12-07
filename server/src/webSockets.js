import socketIO from 'socket.io';

export const socketIO = (() => {
  const io = socketIO(server);

  let sock;

  io.on('connection', (socket) => {
    console.log('A user connected');

    sock = socket
    
    // socket.on('message', (data) => {
    //   console.log(`Received message: ${data}`);
    //     //The received message is broadcasted to all connected clients using the emit() method of the io object.
    //   io.emit('message', data);
    // });
    //an event listener is set up for when a client disconnects.
    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  
  });

  return sock
})()