import { observable } from '@legendapp/state'
import { ResStatusHelpers, TaskHelpers, TaskInProcess } from '../util'
import { ResStatus } from '.'

export const domainState = observable<State>({
  input: { email: '', domain: '' },
  selectedDomain: null,
  reqInProcess: {},
  reqType: null,
  resStatus: {}
})

export const domainTaskHelper = TaskHelpers(domainState.reqInProcess)
export const domainResStatusHelper = ResStatusHelpers(domainState.resStatus)

export type State = {
  input: { email: string; domain: string }
  selectedDomain: number | null
  reqInProcess: TaskInProcess<DomainReqType>
  reqType: DomainReqType | null
  resStatus: ResStatus<DomainReqType>
}

export type DomainReqType = 'create' | 'verify' | 'delete' | 'update'
