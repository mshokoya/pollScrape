import { observable } from '@legendapp/state'
import { CHANNELS } from '../../../../shared/util'

type ForkStatus = 'stopping'

type ForksState = {
  forks: string[]
  createInProcess: number
  stopInProcess: [id: string, stopType: string][]
}

export const forkState$ = observable<ForksState>({
  forks: (await window.fork[CHANNELS.fork_get]()).map((f) => f.forkID),
  createInProcess: 0,
  stopInProcess: []
})
