import { ScrapeQueueEvent } from 'src/shared'
import { handleApolloScrapeProcessQueueEvents, handleApolloScrapeTaskQueueEvents } from './apollo'
import { scrapeTaskQueueHelper } from '../state/scrapeQueue'
import { batch } from '@legendapp/state'

export function handleScrapeQueueEvent(res: ScrapeQueueEvent<unknown>) {
  switch (res.taskType) {
    case 'enqueue':
      scrapeTaskQueueHelper.addToQueue('queue', {
        pid: res.pid,
        taskID: res.taskID,
        taskGroup: res.taskGroup,
        taskType: res.taskType
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
    case 'enqueue': {
      batch(() => {
        scrapeTaskQueueHelper.addToQueue('processing', {
          pid: res.pid,
          taskID: res.taskID,
          taskGroup: res.taskGroup,
          taskType: res.taskType
        })
        scrapeTaskQueueHelper.addProcessToTask(res.taskID, res.pid)
      })
      break
    }
    case 'dequeue': {
      batch(() => {
        scrapeTaskQueueHelper.delete(res.taskID)
        scrapeTaskQueueHelper.deleteProcessFromTask(res.taskID, res.pid)
      })
      break
    }
  }

  switch (res.taskGroup) {
    case 'apollo':
      handleApolloScrapeProcessQueueEvents(
        res as ScrapeQueueEvent<{ accountID: string; taskType: string }>
      )
      break
  }
}
