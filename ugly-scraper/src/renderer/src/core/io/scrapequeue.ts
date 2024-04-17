import { observable } from '@legendapp/state'
import { STQTask, ScrapeQueueEvent, TaskQueue } from 'src/shared'
import { TaskQueueHelper } from '../util'
import { handleApolloScrapeProcessQueueEvents, handleApolloScrapeTaskQueueEvents } from './apollo'

export const scrapeTaskQueue = observable<TaskQueue>({
  queue: [],
  processing: [],
  timeout: []
})

const scrapeTaskQueueHelper = TaskQueueHelper<STQTask>(scrapeTaskQueue)

export function handleScrapeQueueEvent(res: ScrapeQueueEvent<unknown>) {
  switch (res.taskType) {
    case 'enqueue':
      scrapeTaskQueueHelper.addToQueue('queue', {
        pid: res.pid,
        taskID: res.taskID,
        taskGroup: res.taskGroup
      })
      break
    case 'dequeue':
      scrapeTaskQueueHelper.delete(res.taskID)
      break
  }

  switch (res.taskGroup) {
    case 'apollo':
      handleApolloScrapeTaskQueueEvents(
        res.metadata as ScrapeQueueEvent<{ accountID: string; taskType: string }>
      )
      break
  }
}

export const handleScrapeProcessQueueEvent = (res: ScrapeQueueEvent<unknown>) => {
  switch (res.taskType) {
    case 'enqueue':
      scrapeTaskQueueHelper.addToQueue('processing', {
        pid: res.pid,
        taskID: res.taskID,
        taskGroup: res.taskGroup
      })
      break

    case 'dequeue':
      scrapeTaskQueueHelper.delete(res.taskID)
      break
  }

  switch (res.taskGroup) {
    case 'apollo':
      handleApolloScrapeProcessQueueEvents(
        res as ScrapeQueueEvent<{ accountID: string; taskType: string }>
      )
      break
  }
}
