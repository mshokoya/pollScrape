import { observable } from '@legendapp/state'
import { STQTask, STaskQueue } from 'src/shared'
import { TaskQueueHelper } from '../util'

export const scrapeTaskQueue = observable<STaskQueue>({
  queue: [],
  processing: [],
  timeout: []
})

export const scrapeTaskQueueHelper = TaskQueueHelper<STQTask>(scrapeTaskQueue)
