import { taskQueueHelper } from '../state/taskQueue'
import { handleApolloProcessQueueEvents, handleApolloTaskQueueEvents } from './apollo'
import { TaskQueueEvent } from 'src/shared'

export function handleTaskQueueEvent(res: TaskQueueEvent<any>) {
  switch (res.taskType) {
    case 'enqueue':
      taskQueueHelper.addToQueue('queue', {
        taskID: res.taskID,
        taskGroup: res.metadata.taskGroup,
        taskType: res.taskType,
        processes: []
      })
      break

    case 'dequeue':
      taskQueueHelper.delete(res.taskID)
      break
  }

  if (!res.useFork) {
    switch (res.metadata.taskGroup) {
      case 'apollo':
        handleApolloTaskQueueEvents(res as TaskQueueEvent<{ accountID: string; taskType: string }>)
        break
    }
  }
}

export function handleProcessQueueEvent(res: TaskQueueEvent<any>) {
  switch (res.taskType) {
    case 'enqueue':
      taskQueueHelper.addToQueue('processing', {
        taskID: res.taskID,
        taskGroup: res.metadata.taskGroup,
        taskType: res.taskType,
        processes: []
      })
      break

    case 'dequeue':
      taskQueueHelper.delete(res.taskID)
      break
  }

  if (!res.useFork) {
    switch (res.metadata.taskGroup) {
      case 'apollo':
        handleApolloProcessQueueEvents(
          res as TaskQueueEvent<{ accountID: string; taskType: string }>
        )
        break
    }
  }
}
