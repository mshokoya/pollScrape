import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ObservableObject } from "@legendapp/state";


export type Status<ReqType> = [reqType: ReqType, status: 'ok'|'fail']
export type ResStatus<T> = {[entityID: string]: Status<T>[]}

export type TaskStatus = 'queue' | 'processing' | 'timeout'

export type Task<T> = {taskID?: string, type: T, status: TaskStatus} // type === reqType
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

export const getCompletedTaskID = <T>(reqInProcessList: TaskInProcess<T>, taskID: string): [string, number] => {
  for (const [k, v] of Object.entries(reqInProcessList)) {
    const completedTaskIdx = v.findIndex(_ => _.taskID === taskID)
    if (completedTaskIdx > -1) return [k, completedTaskIdx]
  }
  return ['', -1]
}

export const TaskHelpers = <T>(taskInProcess: ObservableObject<TaskInProcess<T>> ) => ({
  getTaskByTaskID: (taskID: string): [entityID: string, idx: number, task?: Task<T>] => {
    for (const [k, v] of Object.entries(taskInProcess.peek())) {
      const taskIdx = v.findIndex(_ => _.taskID === taskID)
      if (taskIdx > -1) return [k, taskIdx, v[taskIdx]]
    }
    return ['', -1, undefined]
  },
  getTaskByReqType: (reqType: string): [entityID: string, idx: number, task?: Task<T>] => {
    for (const [k, v] of Object.entries(taskInProcess.peek())) {
      const taskIdx = v.findIndex(_ => _.type === reqType)
      if (taskIdx > -1) return [k, taskIdx, v[taskIdx]]
    }
    return ['', -1, undefined]
  },
  getEntityTasks: (entityID: string) => taskInProcess[entityID].get() || [],
  isEntityPiplineEmpty: (id: string) => taskInProcess[id].peek() === undefined || !taskInProcess[id].peek().length,
  doesEntityHaveTIP: (id: string) => !!(taskInProcess[id].peek() && taskInProcess[id].peek().find(t1 => t1.taskID !== undefined)) , // background task (task in process)
  doesEntityHaveRIP: (id: string) => !!(taskInProcess[id].peek() && taskInProcess[id].peek().find(t1 => t1.taskID === undefined)),  // regular request (request in process)
  isReqTypeInProcess: (entityID: string, reqType: T) => taskInProcess[entityID].peek().find(t1 => t1.type === reqType),
  deleteTaskByIDX: (id:string, index: number) => {
    const tip = taskInProcess[id].peek()
    if (tip && tip[index] && tip.length > 1) { taskInProcess[id][index].delete()} 
    else if ((tip && tip[index] && tip.length === 1)) { taskInProcess[id].delete() }
  },
  deleteTaskByTaskID: (entityID:string, taskID: string) => {
    const tip = taskInProcess[entityID].peek()
    const idx = tip.findIndex((t1) => t1.taskID !== taskID)
    if (tip && idx > -1 && tip.length > 1 ) { taskInProcess[entityID][idx].delete() } 
    else if (tip && idx > -1 && tip.length === 1 ) { taskInProcess[entityID].delete() }
  },
  deleteTaskByReqType: (entityID:string, reqType: T) => {
    const tip = taskInProcess[entityID].peek()
    const idx = tip.findIndex((t1) => t1.type !== reqType)
    if (tip && idx > -1 && tip.length > 1 ) { taskInProcess[entityID][idx].delete()} 
    else if (tip && idx > -1 && tip.length === 1 ) { taskInProcess[entityID].delete() }
  },
  add: (id: string, task: Task<T>) => {
    const tip = taskInProcess[id].peek()
    tip && tip.length
      ? taskInProcess[id].push(task)
      : taskInProcess[id].set([task])
  },
  findTaskByTaskID: (id:string, taskID: string) => taskInProcess[id].peek().find(t1 => t1.taskID === taskID),
  findTaskByReqType: (id:string, reqType: string) => taskInProcess[id].peek().find(t1 => t1.type === reqType),
  updateTask: (entityID: string, taskID: string, vals: Partial<Task<T>>) => {
    const idx = taskInProcess[entityID].peek().findIndex(t => t.taskID === taskID)
    const tip = taskInProcess[entityID].peek().find(t => t.taskID === taskID)
    if (idx !== -1 && tip) taskInProcess[entityID][idx].set({...tip, ...vals})
  }
})

export const ResStatusHelpers = <RT>(resStatus: ObservableObject<ResStatus<RT>>) => ({
  add: (entityID: string, req: Status<RT>) => {
    const rs = resStatus[entityID].peek()
    rs && rs.length 
      ? resStatus[entityID].push(req)
      : resStatus[entityID].set([req])
  },
  delete: (entityID: string, reqType: RT) => {
    const rs = resStatus[entityID].peek()
    rs && rs.length > 1
        ? resStatus[entityID].set(rs1 => rs1.filter(rs2 => rs2[0] !== reqType))
        : resStatus[entityID].delete()
  },
  getByID: (entityID: string, idx: number) => {
    const rs = resStatus[entityID].peek()
    if (!rs || !rs.length) return ['', '']
    return idx
      ? rs[idx]
      : rs
  },
})