import {Server as IO}  from 'socket.io';

export const SocketIO = (server: any) => {
  const io = new IO(server);

  io.on('connection', (socket) => {
    console.log('A user connected');
    //an event listener is set up for when a client disconnects.
    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  
  });

  return io
}

export let io: IO;

export const initSocketIO = (server: unknown) => {
  io = SocketIO(server);
  return io
}