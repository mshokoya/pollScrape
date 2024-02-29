import { batch } from '@legendapp/state';
import { AccountReqType, IAccount, accountTaskHelper, stateResStatusHelper } from '../state/account.ts';
import { TaskQueueSocketEvent } from './taskqueue.ts';
import { appState$ } from '../state/index.ts';
import { taskQueue } from './taskqueue.ts';

export type ApolloSocketEvent<T = Record<string, any>> = {
  taskID: string
  taskType: string
  message: string
  ok?: boolean
  metadata: T
}

export function handleApolloEvent(res: ApolloSocketEvent<IAccount>) {
  const [accountID, idx, task] = accountTaskHelper.getTaskByTaskID(res.taskID)
  if (!accountID || idx === -1 || !task) return;

  if (res.ok === undefined) {
    console.log(res.message)
  } else  {
    res.ok
      ? stateResStatusHelper.add(accountID, [task.type, 'ok'])
      : stateResStatusHelper.add(accountID, [task.type, 'fail'])

    processApolloEventData(task.type, res)

    setTimeout(() => {
        stateResStatusHelper.delete(accountID, task.type)
    }, 1700)
  }
}

function processApolloEventData(taskType: string, msg: ApolloSocketEvent<IAccount>) {
  switch (taskType) {
    // case 'login'
    // case 'delete':
    // case 'mines':
    // case 'update':
    case 'new':
      if(msg.ok) appState$.accounts.push(msg.metadata)
      break;
    case 'confirm':
    case 'manualUpgrade':
    case 'upgrade':
    case 'check':
      if (msg.ok) {
        const acc = appState$.accounts.find((a) => a._id.get() === msg.metadata._id)
        if (acc) acc.set(msg.metadata)
      }
      break
  }
}

export function handleApolloTaskQueueEvents(res: TaskQueueSocketEvent<{accountID: string}>) {
  switch (res.taskType) {
    case 'enqueue':
      batch(() => {
        taskQueue.queue.push(res)
        const accountID = res.metadata.metadata.accountID!
        accountTaskHelper.add(accountID, {
          status:'queue', 
          type: res.metadata.taskType! as AccountReqType, 
          taskID: res.metadata.taskID
        })
      })
      break
    case 'remove':
      batch(() => {
        const  tsk = taskQueue.queue.find(t => t.metadata.taskID.get() === res.metadata.taskID)
        if (!tsk) return;
        const t2 = tsk.peek()
        accountTaskHelper.deleteTaskByTaskID(t2.metadata.metadata.accountID, t2.metadata.taskID)
        tsk.delete()
      })
      break
    case 'dequeue':
      batch(() => {
        const tsk = taskQueue.queue.find(t => t.metadata.taskID.get() === res.metadata.taskID)
        if (!tsk) return
        tsk.status.set('passing')
        accountTaskHelper.updateTask(tsk.metadata.metadata.accountID.peek(), tsk.metadata.taskID.peek(), {status:'passing'})
      })
      break
    case 'timeout':
      batch(() => {
        const tsk = taskQueue.processing.peek().find(t => t.metadata.taskID === res.metadata.taskID)
        if (!tsk) return;
        taskQueue.timeout.set(q => q.filter(q => q.metadata.taskID !== tsk.metadata.taskID))
        tsk.status = 'timeout'
        taskQueue.timeout.push(tsk)
        accountTaskHelper.updateTask(tsk.metadata.metadata.accountID, tsk.metadata.taskID, {status:'timeout'})
      })
      break
    case 'continue':
      batch(() => {
        const tsk = taskQueue.timeout.peek().find(t => t.metadata.taskID === res.metadata.taskID)
        if (!tsk) return;
        taskQueue.processing.set(q => q.filter(q => q.metadata.taskID !== tsk.metadata.taskID))
        tsk.status = 'processing'
        taskQueue.processing.push(tsk)
        accountTaskHelper.updateTask(tsk.metadata.metadata.accountID, tsk.metadata.taskID, {status: 'processing'})
      })
      break
    }
}

export function handleApolloProcessQueueEvents (res: TaskQueueSocketEvent<{accountID: string}>) {
  switch (res.taskType) {
    case 'enqueue':
      batch(() => {
        const tsk = taskQueue.queue.peek().find(t => t.metadata.taskID === res.metadata.taskID)
        if (!tsk) return;
        taskQueue.queue.set(q => q.filter(q => q.metadata.taskID !== tsk.metadata.taskID))
        tsk.status = 'processing'
        taskQueue.processing.push(tsk)
        accountTaskHelper.updateTask(tsk.metadata.metadata.accountID, tsk.metadata.taskID, {status:'processing'})
      })
      break
    case 'dequeue':
      batch(() => {
        console.log('process dequeue')
        const  tsk = taskQueue.processing.find(t => t.metadata.taskID.get() === res.metadata.taskID)
        if (!tsk) return;
        const t2 = tsk.peek()
        accountTaskHelper.deleteTaskByTaskID(t2.metadata.metadata.accountID, t2.metadata.taskID)
        tsk.delete()
      })
      break
  }
}