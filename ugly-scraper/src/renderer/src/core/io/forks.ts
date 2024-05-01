import { forkState$ } from '../state/fork'

export function handleForkEvent(res: any) {
  console.log('this is the res below')
  console.log(res)

  switch (res.taskType) {
    // case 'stop': {
    //   forks.find((f) => f.id.peek() === res.forkID)?.status.set('stopping')
    //   break
    // }
    case 'create': {
      if (res.ok) forkState$.forks.push(res.forkID)
      forkState$.createInProcess.set((c) => c - 1)
      break
    }
    case 'dead':
      forkState$.forks.set(forkState$.forks.get().filter((f) => f !== res.forkID))
      forkState$.stopInProcess.set((f) => f.filter((f0) => f0[0] !== res.forkID))
      break
    case 'stop':
    case 'force':
    case 'waitPs':
    case 'waitAll':
      break
  }
}
