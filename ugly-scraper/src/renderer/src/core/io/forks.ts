import { batch } from '@legendapp/state'
import { forkState$ } from '../state/fork'

export function handleForkEvent(res: any) {
  switch (res.taskType) {
    // case 'stop': {
    //   forks.find((f) => f.id.peek() === res.forkID)?.status.set('stopping')
    //   break
    // }
    case 'create': {
      batch(() => {
        if (res.ok) forkState$.forks.push(res.forkID)
        forkState$.createInProcess.set((c) => (c - 1 <= 0 ? 0 : c - 1))
      })

      break
    }
    case 'dead':
      batch(() => {
        forkState$.forks.set(forkState$.forks.get().filter((f) => f !== res.forkID))
        forkState$.stopInProcess.set((f) => f.filter((f0) => f0[0] !== res.forkID))
      })
      break
    case 'stop':
    case 'force':
    case 'waitPs':
    case 'waitAll':
      break
  }
}
