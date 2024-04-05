import { observable } from '@legendapp/state'

import { IDomain } from '../../components/DomainField'
import { IProxy } from '../../components/ProxyField'
import { IMetaData, IRecord } from '../../components/RecordField'
import { IAccount } from './account'
import { fetchData } from '../util'
import { CHANNELS } from '../../../../shared/util'

export type Status<ReqType> = [reqType: ReqType, status: 'ok' | 'fail']
export type ResStatus<T> = { [entityID: string]: Status<T>[] }

export type TaskStatus = 'queue' | 'processing' | 'timeout' | 'passing'
export type Task<T> = { taskID?: string; type: T; status: TaskStatus } // type === reqType

export type TaskInProcess<T> = { [id: string]: Task<T>[] }

type AppState = {
  accounts: IAccount[]
  domains: IDomain[]
  proxies: IProxy[]
  metas: IMetaData[]
  records: IRecord[]
}

export const appState$ = observable<AppState>({
  accounts: [],
  domains: [],
  proxies: [],
  metas: [],
  records: []
})

Promise.all([
  await fetchData<IAccount[]>('account', CHANNELS.aga)
    .then((data) => data.data)
    .catch(() => []),
  await fetchData<IDomain[]>('domain', CHANNELS.dga)
    .then((data) => data.data)
    .catch(() => []),
  await fetchData<IProxy[]>('proxy', CHANNELS.pga)
    .then((data) => data.data)
    .catch(() => []),
  await fetchData<IMetaData[]>('metadata', CHANNELS.mga)
    .then((data) => data.data)
    .catch(() => []),
  await fetchData<IRecord[]>('records', CHANNELS.rga)
    .then((data) => data.data)
    .catch(() => [])
]).then((r) => {
  //  ORDER MATTERS
  appState$.set({
    accounts: r[0],
    domains: r[1],
    proxies: r[2],
    metas: r[3],
    records: r[4]
  })
})
