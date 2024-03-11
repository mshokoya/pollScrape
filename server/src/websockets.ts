import {Server as IO}  from 'socket.io';
import { prompt } from './prompt';

type SocketResponse<T = Record<string, any>> = {
  id: string
  type: string
  message: string
  data: T
  ok: boolean
}

export const SocketIO = (server: any) => {
  const io = new IO(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('prompt', (res) => {
      switch (res.type) {
        case "timer":
          // prompt.startTimer(res.metadata.qid, res.metadata.timeLimit)
          break
        case "answer":
          console.log(res)
          prompt.answerQuestion(res.metadata.qid, res.metadata.choiceIDX)
          break
      }
    })

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