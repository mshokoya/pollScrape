import socketIO from 'socket.io';

export const socketio = (server: any) => {
  const io = new socketIO.Server(server);

  io.on('connection', (socket) => {
    console.log('A user connected');
    //an event listener is set up for when a client disconnects.
    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  
  });

  return io
}