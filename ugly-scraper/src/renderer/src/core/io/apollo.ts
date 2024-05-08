import { AccountReqType, IAccount, accountTaskHelper, stateResStatusHelper } from '../state/account'
import { appState$ } from '../state/index'
import { ScrapeQueueEvent, TaskQueueEvent } from 'src/shared'

export function handleApolloScrapeEndEvent(
  res:
    | TaskQueueEvent<{ accountID: string; taskType: string }>
    | ScrapeQueueEvent<{ accountID: string; taskType: string }>
) {
  if (res.ok === undefined) return
  const [accountID, idx, task] = accountTaskHelper.getTaskByTaskID(res.taskID)
  if (!accountID || idx === -1 || !task) return

  accountTaskHelper.deleteTaskByTaskID(accountID, task.taskID!)

  const c = res.ok ? 'ok' : 'fail'
  stateResStatusHelper.add(accountID, [task.type, c])

  processApolloEventData(task.type, res)

  setTimeout(() => {
    stateResStatusHelper.delete(accountID, task.type)
  }, 1700)
}

function processApolloEventData(taskType: string, msg: TaskQueueEvent | ScrapeQueueEvent) {
  switch (taskType) {
    // case 'login'
    // case 'delete':
    // case 'mines':
    // case 'update':
    case 'create': {
      if (msg.ok) appState$.accounts.push(msg.metadata!.metadata as IAccount)
      break
    }
    case 'confirm':
    case 'manualUpgrade':
    case 'upgrade':
    case 'check': {
      if (msg.ok) {
        const acc = appState$.accounts.find((a) => a.id.get() === msg.metadata!.metadata!.accountID)
        if (acc) acc.set({ ...acc.get(), ...(msg.metadata!.metadata as IAccount) })
      }
      break
    }
  }
}

export function handleApolloTaskQueueEvents(
  res:
    | TaskQueueEvent<{ accountID: string; taskType: string }>
    | ScrapeQueueEvent<{ accountID: string; taskType: string }>
  // TaskQueueEvent<{ accountID: string; taskType: string }>
) {
  switch (res.taskType) {
    case 'enqueue': {
      const accountID = res.metadata!.metadata!.accountID
      accountTaskHelper.add(accountID, {
        status: 'queue',
        type: res.taskType as AccountReqType,
        taskID: res.taskID
      })
      break
    }
    case 'dequeue':
      accountTaskHelper.updateTask(res.metadata!.metadata!.accountID, res.taskID, {
        status: 'passing'
      })
      break
  }
}

export function handleApolloProcessQueueEvents(
  res: TaskQueueEvent<{ accountID: string; taskType: string }>
) {
  switch (res.taskType) {
    case 'enqueue':
      accountTaskHelper.updateTask(res.metadata!.metadata!.accountID, res.taskID, {
        status: 'processing'
      })
      break
    case 'dequeue':
      accountTaskHelper.deleteTaskByTaskID(res.metadata!.metadata!.accountID, res.taskID)
      break
  }
}

export const handleApolloScrapeTaskQueueEvents = (res: ScrapeQueueEvent<{ accountID: string }>) => {
  switch (res.taskType) {
    case 'enqueue': {
      const accountID = res.metadata!.metadata!.accountID
      accountTaskHelper.add(accountID, {
        status: 'queue',
        type: res.metadata!.taskType as AccountReqType,
        taskID: res.metadata!.taskID
      })
      break
    }
    case 'dequeue':
      accountTaskHelper.deleteTaskByTaskID(res.metadata!.metadata!.accountID, res.taskID)
      break
  }
}

export const handleApolloScrapeProcessQueueEvents = (
  res: ScrapeQueueEvent<{ accountID: string }>
) => {
  switch (res.taskType) {
    case 'enqueue': {
      const accountID = res.metadata!.metadata!.accountID
      accountTaskHelper.add(accountID, {
        status: 'queue',
        type: res.metadata!.taskType as AccountReqType,
        taskID: res.taskID
      })
      break
    }
    case 'dequeue':
      accountTaskHelper.deleteTaskByTaskID(res.metadata!.metadata!.accountID, res.taskID)
      break
  }
}
