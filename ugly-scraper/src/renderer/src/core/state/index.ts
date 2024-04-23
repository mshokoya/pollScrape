import { observable } from '@legendapp/state'

import { IDomain, IMetaData, IRecords } from 'src/shared'
// import { IProxy } from '../../components/ProxyField'

import { IAccount } from './account'
import { fetchData } from '../util'
import { CHANNELS } from '../../../../shared/util'
import { metaMockData } from '../mockdata'

export type Status<ReqType> = [reqType: ReqType, status: 'ok' | 'fail']
export type ResStatus<T> = { [entityID: string]: Status<T>[] }

export type TaskStatus = 'queue' | 'processing' | 'timeout' | 'passing'
export type Task<T> = { taskID?: string; type: T; status: TaskStatus } // type === reqType

export type TaskInProcess<T> = { [id: string]: Task<T>[] }

type AppState = {
  accounts: IAccount[]
  domains: IDomain[]
  // proxies: IProxy[]
  metas: IMetaData[]
  records: IRecords[]
}

export const appState$ = observable<AppState>({
  accounts: [],
  domains: [],
  // proxies: [],
  metas: [],
  records: []
})

Promise.all([
  fetchData<IAccount[]>('account', CHANNELS.a_accountGetAll)
    .then((data) => data.data)
    .catch(() => []),
  fetchData<IDomain[]>('domain', CHANNELS.a_domainGetAll)
    .then((data) => data.data)
    .catch(() => []),
  // fetchData<IProxy[]>('proxy', CHANNELS.a_proxyGetAll)
  //   .then((data) => data.data)
  //   .catch(() => []),
  fetchData<IMetaData[]>('meta', CHANNELS.a_metadataGetAll)
    .then((data) => data.data)
    .catch(() => []),
  fetchData<IRecords[]>('record', CHANNELS.a_recordsGetAll)
    .then((data) => data.data)
    .catch(() => [])
]).then((r) => {
  //  ORDER MATTERS
  appState$.set({
    accounts: r[0],
    domains: metaMockData,
    // domains: r[1],
    // proxies: r[2],
    metas: r[2],
    records: r[3]
  })
})

const position = { x: 0, y: 0 }
const edgeType = 'smoothstep'

export const initialNodes: any[] = [
  {
    id: 'tq',
    position,
    data: { label: 'task queue' },
    style: { fontSize: '1.5rem', fontWeight: 700 },
    className: 'li',
    draggable: true
  },
  {
    id: 'q',
    data: { label: 'wait queue' },
    position,
    // type: 'group',
    className: 'li',
    style: {
      backgroundColor: 'rgba(255, 165, 0, 0.7)',
      width: '300px',
      height: '300px',
      fontSize: '1.5rem',
      fontWeight: 400
    },
    draggable: true
  },
  {
    id: 'p',
    data: { label: 'processing queue' },
    position,
    className: 'li',
    style: { backgroundColor: 'rgba(0, 128, 0, 0.7)', fontSize: '1.5rem', fontWeight: 400 },
    draggable: true
  },
  {
    id: 't',
    data: { label: 'timeout queue' },
    position,
    className: 'li',
    style: {
      backgroundColor: 'rgba(255, 0, 0, 0.7)',
      fontSize: '1.5rem',
      fontWeight: 400
    },
    draggable: true
  }
]

export const initialEdges = [
  { id: 'tqq', source: 'tq', target: 'q', type: edgeType, animated: true },
  { id: 'tqp', source: 'tq', target: 'p', type: edgeType, animated: true },
  { id: 'tqt', source: 'tq', target: 't', type: edgeType, animated: true }
]
