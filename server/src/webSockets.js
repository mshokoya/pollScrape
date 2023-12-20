import socketIO from 'socket.io';

export const socketIO = (() => {
  const io = socketIO(server);

  let sock;

  io.on('connection', (socket) => {
    console.log('A user connected');

    sock = socket
    
    //an event listener is set up for when a client disconnects.
    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  
  });

  return sock
})()