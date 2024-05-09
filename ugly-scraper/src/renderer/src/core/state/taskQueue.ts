import { observable } from '@legendapp/state'

import { TQTask, TaskQueue } from 'src/shared'
import { TaskQueueHelper } from '../util'

export const taskQueue = observable<TaskQueue>({
  queue: [],
  processing: [],
  timeout: []
})

export const taskQueueHelper = TaskQueueHelper<TQTask>(taskQueue)
