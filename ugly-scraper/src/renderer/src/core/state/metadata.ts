import { observable } from '@legendapp/state'
import { ResStatusHelpers, TaskHelpers, TaskInProcess } from '../util'
import { ResStatus } from '.'

export const metadataState = observable<State>({
  selectedMeta: null,
  reqInProcess: {},
  reqType: null,
  resStatus: {}
})

export const metadataTaskHelper = TaskHelpers(metadataState.reqInProcess)
export const metadataResStatusHelper = ResStatusHelpers(metadataState.resStatus)

export type State = {
  selectedMeta: number | null
  reqInProcess: TaskInProcess<MetadataReqType>
  reqType: MetadataReqType | null
  resStatus: ResStatus<MetadataReqType>
}

export type MetadataReqType = 'continue' | 'update' | 'delete'
