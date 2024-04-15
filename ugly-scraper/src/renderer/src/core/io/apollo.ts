import { AccountReqType, IAccount, accountTaskHelper, stateResStatusHelper } from '../state/account'
import { appState$ } from '../state/index'
import { ScrapeQueueEvent, TaskQueueEvent } from 'src/shared'

export function handleApolloScrapeEndEvent(
  res:
    | TaskQueueEvent<{ accountID: string; taskType: string }>
    | ScrapeQueueEvent<{ accountID: string; taskType: string }>
) {
  const [accountID, idx, task] = accountTaskHelper.getTaskByTaskID(res.taskID)
  if (!accountID || idx === -1 || !task) return

  if (res.ok === undefined) {
    console.log(res.message)
  } else {
    res.ok
      ? stateResStatusHelper.add(accountID, [task.type, 'ok'])
      : stateResStatusHelper.add(accountID, [task.type, 'fail'])

    processApolloEventData(task.type, res)

    setTimeout(() => {
      stateResStatusHelper.delete(accountID, task.type)
    }, 1700)
  }
}

function processApolloEventData(taskType: string, msg: TaskQueueEvent | ScrapeQueueEvent) {
  switch (taskType) {
    // case 'login'
    // case 'delete':
    // case 'mines':
    // case 'update':
    case 'new':
      if (msg.ok) appState$.accounts.push(msg.metadata.metadata as IAccount)
      break
    case 'confirm':
    case 'manualUpgrade':
    case 'upgrade':
    case 'check':
      if (msg.ok) {
        const acc = appState$.accounts.find((a) => a.id.get() === msg.metadata.metadata.accountID)
        if (acc) acc.set(msg.metadata.metadata as IAccount)
      }
      break
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
      const accountID = res.metadata.metadata.accountID
      accountTaskHelper.add(accountID, {
        status: 'queue',
        type: res.taskType as AccountReqType,
        taskID: res.taskID
      })
      break
    }
    case 'dequeue':
      accountTaskHelper.updateTask(res.metadata.metadata.accountID, res.taskID, {
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
      accountTaskHelper.updateTask(res.metadata.metadata.accountID, res.taskID, {
        status: 'processing'
      })
      break
    case 'dequeue':
      accountTaskHelper.deleteTaskByTaskID(res.metadata.metadata.accountID, res.taskID)
      break
  }
}

export const handleApolloScrapeTaskQueueEvents = (res: ScrapeQueueEvent<{ accountID: string }>) => {
  switch (res.taskType) {
    case 'enqueue': {
      const accountID = res.metadata.metadata.accountID
      accountTaskHelper.add(accountID, {
        status: 'queue',
        type: res.metadata.taskType as AccountReqType,
        taskID: res.metadata.taskID
      })
      break
    }
    case 'dequeue':
      accountTaskHelper.updateTask(res.metadata.metadata.accountID, res.taskID, {
        status: 'passing'
      })
      break
  }
}

export const handleApolloScrapeProcessQueueEvents = (
  res: ScrapeQueueEvent<{ accountID: string }>
) => {
  switch (res.taskType) {
    case 'enqueue': {
      const accountID = res.metadata.metadata.accountID
      accountTaskHelper.add(accountID, {
        status: 'queue',
        type: res.metadata.taskType as AccountReqType,
        taskID: res.metadata.taskID
      })
      break
    }
    case 'dequeue':
      accountTaskHelper.updateTask(res.metadata.metadata.accountID, res.taskID, {
        status: 'passing'
      })
      break
  }
}

// export function handleApolloEvent(res: ApolloSocketEvent<IAccount>) {
//   const [accountID, idx, task] = accountTaskHelper.getTaskByTaskID(res.taskID)
//   if (!accountID || idx === -1 || !task) return

//   if (res.ok === undefined) {
//     console.log(res.message)
//   } else {
//     res.ok
//       ? stateResStatusHelper.add(accountID, [task.type, 'ok'])
//       : stateResStatusHelper.add(accountID, [task.type, 'fail'])

//     processApolloEventData(task.type, res)

//     setTimeout(() => {
//       stateResStatusHelper.delete(accountID, task.type)
//     }, 1700)
//   }
// }

// function processApolloEventData(taskType: string, msg: ApolloSocketEvent<IAccount>) {
//   switch (taskType) {
//     // case 'login'
//     // case 'delete':
//     // case 'mines':
//     // case 'update':
//     case 'new':
//       if (msg.ok) appState$.accounts.push(msg.metadata)
//       break
//     case 'confirm':
//     case 'manualUpgrade':
//     case 'upgrade':
//     case 'check':
//       if (msg.ok) {
//         const acc = appState$.accounts.find((a) => a.id.get() === msg.metadata.id)
//         if (acc) acc.set(msg.metadata)
//       }
//       break
//   }
// }

// export function handleApolloTaskQueueEvents(res: TaskQueueEvent<{ accountID: string }>) {
//   switch (res.taskType) {
//     case 'enqueue':
//       batch(() => {
//         taskQueue.queue.push(res)
//         const accountID = res.metadata.metadata!.accountID
//         accountTaskHelper.add(accountID, {
//           status: 'queue',
//           type: res.metadata.taskType as AccountReqType,
//           taskID: res.metadata.taskID
//         })
//       })
//       break
//     case 'remove':
//       batch(() => {
//         const tsk = taskQueue.queue.find((t) => t.metadata.taskID.get() === res.metadata.taskID)
//         if (!tsk) return
//         const t2 = tsk.peek()
//         accountTaskHelper.deleteTaskByTaskID(t2.metadata.metadata.accountID, t2.metadata.taskID)
//         tsk.delete()
//       })
//       break
//     case 'dequeue':
//       batch(() => {
//         const tsk = taskQueue.queue.find((t) => t.metadata.taskID.get() === res.metadata.taskID)
//         if (!tsk) return
//         tsk.status.set('passing')
//         accountTaskHelper.updateTask(
//           tsk.metadata.metadata.accountID.peek(),
//           tsk.metadata.taskID.peek(),
//           { status: 'passing' }
//         )
//       })
//       break
//     case 'timeout':
//       batch(() => {
//         const tsk = taskQueue.processing
//           .peek()
//           .find((t) => t.metadata.taskID === res.metadata.taskID)
//         if (!tsk) return
//         taskQueue.timeout.set((q) => q.filter((q) => q.metadata.taskID !== tsk.metadata.taskID))
//         tsk.status = 'timeout'
//         taskQueue.timeout.push(tsk)
//         accountTaskHelper.updateTask(tsk.metadata.metadata.accountID, tsk.metadata.taskID, {
//           status: 'timeout'
//         })
//       })
//       break
//     case 'continue':
//       batch(() => {
//         const tsk = taskQueue.timeout.peek().find((t) => t.metadata.taskID === res.metadata.taskID)
//         if (!tsk) return
//         taskQueue.processing.set((q) => q.filter((q) => q.metadata.taskID !== tsk.metadata.taskID))
//         tsk.status = 'processing'
//         taskQueue.processing.push(tsk)
//         accountTaskHelper.updateTask(tsk.metadata.metadata.accountID, tsk.metadata.taskID, {
//           status: 'processing'
//         })
//       })
//       break
//   }
// }

// export function handleApolloProcessQueueEvents(res: TaskQueueEvent<{ accountID: string }>) {
//   switch (res.taskType) {
//     case 'enqueue':
//       batch(() => {
//         const tsk = taskQueue.queue.peek().find((t) => t.metadata.taskID === res.metadata.taskID)
//         if (!tsk) return
//         taskQueue.queue.set((q) => q.filter((q) => q.metadata.taskID !== tsk.metadata.taskID))
//         tsk.status = 'processing'
//         taskQueue.processing.push(tsk)
//         accountTaskHelper.updateTask(tsk.metadata.metadata.accountID, tsk.metadata.taskID, {
//           status: 'processing'
//         })
//       })
//       break
//     case 'dequeue':
//       batch(() => {
//         console.log('process dequeue')
//         const tsk = taskQueue.processing.find(
//           (t) => t.metadata.taskID.get() === res.metadata.taskID
//         )
//         if (!tsk) return
//         const t2 = tsk.peek()
//         accountTaskHelper.deleteTaskByTaskID(t2.metadata.metadata.accountID, t2.metadata.taskID)
//         tsk.delete()
//       })
//       break
//   }
// }
