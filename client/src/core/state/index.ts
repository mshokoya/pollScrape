import { observable } from "@legendapp/state";

import { IDomain } from "../../components/DomainField";
import { IProxy } from "../../components/ProxyField";
import { IMetaData, IRecord } from "../../components/RecordField";
import { IAccount } from "./account";
import { fetchData } from "../util";


export type Status<ReqType> = [reqType: ReqType, status: 'ok'|'fail']
export type ResStatus<T> = {[entityID: string]: Status<T>[]}

export type TaskStatus = 'queue' | 'processing' | 'timeout' | 'passing'
export type Task<T> = {taskID?: string, type: T, status: TaskStatus} // type === reqType

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
  records: [],
});

Promise.all([
  await fetchData<IAccount[]>('/account', 'GET').then(data => data.data).catch(() => []),
  await fetchData<IDomain[]>('/domain', 'GET').then(data => data.data).catch(() => []),
  await fetchData<IProxy[]>('/proxy', 'GET').then( data => data.data).catch(() => []),
  await fetchData<IMetaData[]>('/metadata', 'GET').then( data => data.data).catch(() => []),
  await fetchData<IRecord[]>('/records', 'GET').then( data => data.data).catch(() => [])
]).then((r) => {
  //  ORDER MATTERS
  appState$.set({
    accounts: r[0],
    domains: r[1],
    proxies: r[2],
    metas: r[3],
    records: r[4],
  })
})