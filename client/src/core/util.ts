import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ObservableObject, observable } from "@legendapp/state";
import { IAccount, ReqType } from "@/components/AccountField";
import { IDomain } from "@/components/DomainField";
import { IProxy } from "@/components/ProxyField";
import { IMetaData, IRecord } from "@/components/RecordField";

export type Status = [reqType: ReqType, status: 'ok'|'fail']
export type ResStatus = {[entityID: string]: Status[]}

export type TaskStatus = 'queue' | 'processing' | 'timeout'

type AppState = {
  accounts: IAccount[]
  domains: IDomain[]
  proxies: IProxy[]
  metas: IMetaData[]
  records: IRecord[]
}

export type Task<T> = {taskID?: string, status: TaskStatus, type: T} // type === reqType
export type TaskInProcess<T> = { [id: string]: Task<T>[] }

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type FetchData<T = unknown> = {ok: boolean, message: string | null, data: T}

export const fetchData = async <T>(url: string, method: string, data?: any): Promise<FetchData<T>> => {
  return await fetch(`http://localhost:4000${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      'Accept-Encoding': 'gzip'
    },
    body: JSON.stringify(data),
  }).then(res => res.json())
}

export const blinkCSS = (
  reqInProces: boolean = false, 
  color: string = 'text-cyan-600'
) => `${reqInProces ? `blink ${color}` : ''}`

export const appState$ = observable<AppState>({
  accounts: [],
  domains: [],
  proxies: [],
  metas: [],
  records: [],
});

export const getCompletedTaskID = <T>(reqInProcessList: TaskInProcess<T>, taskID: string): [string, number] => {
  for (const [k, v] of Object.entries(reqInProcessList)) {
    const completedTaskIdx = v.findIndex(_ => _.taskID === taskID)
    if (completedTaskIdx > -1) return [k, completedTaskIdx]
  }
  return ['', -1]
}

export const TaskHelpers = <T>(taskInProcess: ObservableObject<TaskInProcess<T>> ) => ({
  getTaskByTaskID: (taskID: string): [entityID: string, idx: number, task?: Task<T>] => {
    for (const [k, v] of Object.entries(taskInProcess)) {
      const taskIdx = v.findIndex(_ => _.taskID === taskID)
      if (taskIdx > -1) return [k, taskIdx, v[taskIdx].peek()]
    }
    return ['', -1, undefined]
  },
  getEntityTasks: (entityID: string) => taskInProcess[entityID].get(),
  isEntityPiplineEmpty: (id: string) =>  taskInProcess[id].peek() === undefined || !taskInProcess[id].peek().length,
  doesEntityHaveTIP: (id: string) => !!taskInProcess[id].find(t1 => t1.taskID !== undefined), // background task (task in process)
  doesEntityHaveRIP: (id: string) => !!taskInProcess[id].find(t1 => t1.taskID === undefined),  // regular request (request in process)
  isReqTypeInProcess: (entityID: string, reqType: ReqType) => taskInProcess[entityID].find(t1 => t1.get().type === reqType),
  deleteTaskByIDX: (id:string, index: number) => taskInProcess[id][index].delete(),
  deleteTaskByTaskID: (id:string, taskID: string) => taskInProcess[id].set( t => t.filter((t1) => t1.taskID !== taskID) ),
  deleteTaskByReqType: (id:string, reqType: ReqType) => taskInProcess[id].set( t => t.filter((t1) => t1.type !== reqType) ),
  add: (id: string, task: Task<T> | Omit<Task<T>, 'taskID'>) => {
    const tip = taskInProcess[id].peek()
    tip && tip.length
      ? taskInProcess[id].push(task)
      : taskInProcess[id].set([task])
  },
  findTaskByTaskID: (id:string, taskID: string) => taskInProcess[id].peek().find(t1 => t1.taskID === taskID),
  findTaskByReqType: (id:string, reqType: string) => taskInProcess[id].peek().find(t1 => t1.type === reqType),
})

export const ResStatusHelpers = (resStatus: ObservableObject<ResStatus>) => ({
  add: (entityID: string, req: Status) => {
    const rs = resStatus[entityID].peek()
    rs && rs.length 
      ? resStatus[entityID].push(req)
      : resStatus[entityID].set([req])
  },
  delete: (entityID: string, reqType: ReqType) => {
    const rs = resStatus[entityID].peek()
    if (rs && rs.length) resStatus[entityID].set(rs1 => rs1.filter(rs2 => rs2[0] !== reqType))
  },
  getByID: (entityID: string, idx: number) => {
    const rs = resStatus[entityID]
    if (!rs || !rs.length) return ['', '']
    return idx
      ? rs[idx]
      : rs
  },
})