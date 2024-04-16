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
  fetchData<IAccount[]>('account', CHANNELS.a_accountGetAll)
    .then((data) => data.data)
    .catch(() => []),
  fetchData<IDomain[]>('domain', CHANNELS.a_domainGetAll)
    .then((data) => data.data)
    .catch(() => []),
  fetchData<IProxy[]>('proxy', CHANNELS.a_proxyGetAll)
    .then((data) => data.data)
    .catch(() => []),
  fetchData<IMetaData[]>('metadata', CHANNELS.a_metadataGetAll)
    .then((data) => data.data)
    .catch(() => []),
  fetchData<IRecord[]>('records', CHANNELS.a_recordsGetAll)
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
