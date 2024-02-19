import {Server as IO}  from 'socket.io';

type SocketResponse<T = Record<string, any>> = {
  id: string
  type: string
  message: string
  data: T
  ok: boolean
}

export const SocketIO = (server: any) => {
  const io = new IO(server);

  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });

  return io
}

export const socketResponse = <T>(args: SocketResponse) => {}

export let io: IO;

export const initSocketIO = (server: unknown) => {
  io = SocketIO(server);
  return io
}