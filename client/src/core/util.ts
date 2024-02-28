import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ObservableObject } from "@legendapp/state";


export type Status<ReqType> = [reqType: ReqType, status: 'ok'|'fail']
export type ResStatus<T> = {[entityID: string]: Status<T>[]}

export type TaskStatus = 'queue' | 'processing' | 'timeout' | 'passing'
export type Task<T> = {taskID?: string, type: T, status: TaskStatus} // type === reqType

export type TaskInProcess<T> = { [id: string]: Task<T>[] }

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type FetchData<T = unknown> = {ok: boolean, message: string | null, data: T}

export const delay = (time: number) => {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

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

export function TaskHelpers <T>(taskInProcess: ObservableObject<TaskInProcess<T>> ) {
  return {
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
  isEntityPiplineEmpty: (entityID: string) => taskInProcess[entityID].peek() === undefined || !taskInProcess[entityID].peek().length,
  doesEntityHaveTIP: (entityID: string) => !!(taskInProcess[entityID].peek() && taskInProcess[entityID].peek().find(t1 => t1.taskID !== undefined)) , // background task (task in process)
  doesEntityHaveRIP: (entityID: string) => !!(taskInProcess[entityID].peek() && taskInProcess[entityID].peek().find(t1 => t1.taskID === undefined)),  // regular request (request in process)
  isReqTypeInProcess: (entityID: string, reqType: T) => taskInProcess[entityID].peek().find(t1 => t1.type === reqType),
  deleteTaskByIDX: (entityID:string, index: number) => {
    const tip = taskInProcess[entityID].peek()
    if (tip && tip[index] && tip.length > 1) { taskInProcess[entityID][index].delete()} 
    else if ((tip && tip[index] && tip.length === 1)) { taskInProcess[entityID].delete() }
  },
  deleteTaskByTaskID: (entityID:string, taskID: string) => {
    console.log('peek')
    console.log(entityID, taskID)
    console.log(taskInProcess[entityID].peek())
    const tip = taskInProcess[entityID].peek()
    const idx = tip.findIndex((t1) => t1.taskID === taskID)
    if (tip && idx > -1 && tip.length > 1 ) { taskInProcess[entityID][idx].delete() } 
    else if (tip && idx > -1 && tip.length === 1 ) { taskInProcess[entityID].delete() }
  },
  deleteTaskByReqType: (entityID:string, reqType: T) => {
    const tip = taskInProcess[entityID].peek()
    const idx = tip.findIndex((t1) => t1.type !== reqType)
    if (tip && idx > -1 && tip.length > 1 ) { taskInProcess[entityID][idx].delete()} 
    else if (tip && idx > -1 && tip.length === 1 ) { taskInProcess[entityID].delete() }
  },
  add: (entityID: string, task: Task<T>) => {
    const tip = taskInProcess[entityID].peek()
    tip && tip.length
      ? taskInProcess[entityID].push(task)
      : taskInProcess[entityID].set([task])
  },
  findTaskByTaskID: (entityID:string, taskID: string) => taskInProcess[entityID].peek().find(t1 => t1.taskID === taskID),
  findTaskByReqType: (entityID:string, reqType: string) => taskInProcess[entityID].peek().find(t1 => t1.type === reqType),
  updateTask: (entityID: string, taskID: string, vals: Partial<Task<T>>) => {
    const idx = taskInProcess[entityID].peek().findIndex(t => t.taskID === taskID)
    const tip = taskInProcess[entityID].peek().find(t => t.taskID === taskID)
    if (idx !== -1 && tip) taskInProcess[entityID][idx].set({...tip, ...vals})
  }
  }
}

export const ResStatusHelpers = <RT>(resStatus: ObservableObject<ResStatus<RT>>) => ({
  add: (entityID: string, req: Status<RT>) => {
    const rs = resStatus[entityID].peek()
    rs && rs.length 
      ? resStatus[entityID].push(req)
      : resStatus[entityID].set([req])
  },
  delete: (entityID: string, reqType: RT) => {
    const rsl = resStatus[entityID]
    console.log(rsl.peek() && rsl.peek().length > 1)
    if (rsl.peek() && rsl.peek().length > 1) {
      console.log('del if')
      const rs = rsl.find(rs1 => rs1[0].peek() === reqType)
      if (rs) { rs.delete() }
    } else {
      console.log('del else')
      resStatus[entityID].delete()
    }
  },
  getByID: (entityID: string, idx: number) => {
    const rs = resStatus[entityID].get()
    if (!rs || !rs.length) return ['', '']
    return rs[idx]
  },
})