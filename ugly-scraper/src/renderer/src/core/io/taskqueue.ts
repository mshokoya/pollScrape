import { observable } from '@legendapp/state'
import { handleApolloTaskQueueEvents } from './apollo'

export type TaskQueueSocketEvent<T = Record<string, any>, ReqType = string> = {
  taskType: ReqType
  message: string
  // status?: string
  metadata: {
    taskID: string
    taskGroup: string
    taskType: string
    metadata: T
  }
}

export const taskQueue = observable<{
  queue: TaskQueueSocketEvent<any>[]
  processing: TaskQueueSocketEvent<any>[]
  timeout: TaskQueueSocketEvent<any>[]
}>({
  queue: [],
  processing: [],
  timeout: []
})

export function handleTaskQueueEvent(res: TaskQueueSocketEvent<any>) {
  switch (res.metadata.taskGroup) {
    case 'apollo':
      handleApolloTaskQueueEvents(res)
      break
  }
}
