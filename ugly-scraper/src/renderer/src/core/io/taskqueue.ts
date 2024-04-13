import { observable } from '@legendapp/state'
import { handleApolloTaskQueueEvents } from './apollo'
import { TaskQueueEvent } from 'src/shared'

// export type TaskQueueSocketEvent<T = Record<string, any>, ReqType = string> = {
//   taskType: ReqType
//   message: string
//   status?: string
//   metadata: {
//     taskID: string
//     taskGroup: string
//     taskType: string
//     metadata: T
//   }
// }

export const taskQueue = observable<{
  queue: TaskQueueEvent<any>[]
  processing: TaskQueueEvent<any>[]
  timeout: TaskQueueEvent<any>[]
}>({
  queue: [],
  processing: [],
  timeout: []
})

export function handleTaskQueueEvent(res: TaskQueueEvent<any>) {
  switch (res.metadata.taskGroup) {
    case 'apollo':
      handleApolloTaskQueueEvents(res)
      break
  }
}
