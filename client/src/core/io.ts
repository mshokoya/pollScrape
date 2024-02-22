import { io as socket } from "socket.io-client";
import { TaskStatus } from "./util";

export type IOResponse<T = Record<string, any >, ReqType = string> = {
  taskID: string
  type?: ReqType
  message: string
  status: TaskStatus
  data: T 
  ok: boolean
}

export const io = socket("localhost:4000");
