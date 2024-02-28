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
  accounts: await fetchData<IAccount[]>('/account', 'GET').then(data => data.data).catch(() => []),
  domains: await fetchData<IDomain[]>('/domain', 'GET').then(data => data.data).catch(() => []),
  // proxies: await fetchData<IProxy[]>('/proxy', 'GET').then( data => data.data).catch(() => []),
  // metas: await fetchData<IMetaData[]>('/metadata', 'GET').then( data => data.data).catch(() => []),
  // records: await fetchData<IRecord[]>('/records', 'GET').then( data => data.data).catch(() => []),
});