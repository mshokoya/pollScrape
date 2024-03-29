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

export const promptCountdownTime = 10000;

export const delay = (time: number) => {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

export const fmtDate = (n: any) => n && n !== 'n/a'
? new Date(n).toDateString()
: "N/A";

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
    for (const [k, v] of Object.entries(taskInProcess.get())) {
      const taskIdx = v.findIndex(_ => _.taskID === taskID)
      if (taskIdx > -1) return [k, taskIdx, v[taskIdx]]
    }
    return ['', -1, undefined]
  },
  getTaskByReqType: (reqType: string): [entityID: string, idx: number, task?: Task<T>] => {
    for (const [k, v] of Object.entries(taskInProcess.get())) {
      const taskIdx = v.findIndex(_ => _.type === reqType)
      if (taskIdx > -1) return [k, taskIdx, v[taskIdx]]
    }
    return ['', -1, undefined]
  },
  getEntityTasks: (entityID: string) => taskInProcess[entityID].get() || [],
  isEntityPiplineEmpty: (entityID: string) => taskInProcess[entityID].get() === undefined || !taskInProcess[entityID].get().length,
  doesEntityHaveTIP: (entityID: string) => !!(taskInProcess[entityID].get() && taskInProcess[entityID].get().find(t1 => t1.taskID !== undefined)) , // background task (task in process)
  doesEntityHaveRIP: (entityID: string) => !!(taskInProcess[entityID].get() && taskInProcess[entityID].get().find(t1 => t1.taskID === undefined)),  // regular request (request in process)
  isReqTypeInProcess: (entityID: string, reqType: T) => taskInProcess[entityID].get().find(t1 => t1.type === reqType),
  deleteTaskByIDX: (entityID:string, index: number) => {
    const tip = taskInProcess[entityID].get()
    if (tip && tip[index] && tip.length > 1) { taskInProcess[entityID][index].delete()} 
    else if ((tip && tip[index] && tip.length === 1)) { taskInProcess[entityID].delete() }
  },
  deleteTaskByTaskID: (entityID:string, taskID: string) => {
    const tip = taskInProcess[entityID].get()
    const idx = tip.findIndex((t1) => t1.taskID === taskID)
    if (tip && idx > -1 && tip.length > 1 ) { taskInProcess[entityID][idx].delete() } 
    else if (tip && idx > -1 && tip.length === 1 ) { taskInProcess[entityID].delete() }
  },
  deleteTaskByReqType: (entityID:string, reqType: T) => {
    const tip = taskInProcess[entityID].get()
    const idx = tip.findIndex((t1) => t1.type === reqType)
    console.log(idx)
    if (tip && idx > -1 && tip.length > 1 ) { taskInProcess[entityID][idx].delete()} 
    else if (tip && idx > -1 && tip.length === 1 ) { taskInProcess[entityID].delete() }
  },
  add: (entityID: string, task: Task<T>) => {
    const tip = taskInProcess[entityID].get()
    tip && tip.length
      ? taskInProcess[entityID].push(task)
      : taskInProcess[entityID].set([task])
  },
  findTaskByTaskID: (entityID:string, taskID: string) => taskInProcess[entityID].get()?.find(t1 => t1.taskID === taskID),
  findTaskByReqType: (entityID:string, reqType: string) => taskInProcess[entityID].get()?.find(t1 => t1.type === reqType),
  updateTask: (entityID: string, taskID: string, vals: Partial<Task<T>>) => {
    const idx = taskInProcess[entityID].get().findIndex(t => t.taskID === taskID)
    const tip = taskInProcess[entityID].get().find(t => t.taskID === taskID)
    if (idx !== -1 && tip) taskInProcess[entityID][idx].set({...tip, ...vals})
  }
  }
}

export const ResStatusHelpers = <RT>(resStatus: ObservableObject<ResStatus<RT>>) => ({
  add: (entityID: string, req: Status<RT>) => {
    const rs = resStatus[entityID].get()
    rs && rs.length 
      ? resStatus[entityID].push(req)
      : resStatus[entityID].set([req])
  },
  delete: (entityID: string, reqType: RT) => {
    const rsl = resStatus[entityID]
    console.log(rsl.get() && rsl.get().length > 1)
    if (rsl.get() && rsl.get().length > 1) {
      const rs = rsl.find(rs1 => rs1[0].get() === reqType)
      if (rs) { rs.delete() }
    } else {
      resStatus[entityID].delete()
    }
  },
  getByID: (entityID: string, idx: number) => {
    const rs = resStatus[entityID].get()
    if (!rs || !rs.length) return ['', '']
    return rs[idx]
  },
})


// (FIX) infinate is defined as undefined
export const getRangeFromApolloURL = (url: string): [min: number | null, max: number | null] => {
  const pURL = new URLSearchParams(url.split('/#/people?')[1]);
  const range = pURL.getAll('organizationNumEmployeesRanges[]')
  if (!range.length) return [null, null]
  const min = range[0].match(/.+?(?=%2C)/) 
  const max = range[0].match(/(?<=%2C).+$/)

  return [
    min ? parseInt(min[0]) : null, 
    max ? parseInt(max[0]) : null
  ]
}

export const setRangeInApolloURL = (url: string, range: [min: number, max: number]) => {
  if (!url.includes('/#/people?')) return url
  const params = new URLSearchParams(url.split('/#/people?')[1]);
  params.set('organizationNumEmployeesRanges[]', `${range[0]}%2C${range[1]}`)
  return decodeURI(`${url.split('?')[0]}?${params.toString()}`)
}

// min - 1 / max - 3 // lowest
// if (max - min <= 4) only use 2 scrapers, (max - min >= 5) use 3 or more
export const chuckRange = (min: number, max: number, parts: number): [number, number][] => {
  //@ts-ignore
  const result: [number, number][] = [[]]
  const delta = Math.round((max - min) / (parts - 1));

  while (min < max) {
    const l = result.length-1
    if (result.length === 1 && result[l].length < 2) {
       //@ts-ignore
      result[l].push(min)
    } else {
       //@ts-ignore
      result.push([result[l][1]+1, min])
    }
    min += delta;
  }

  //@ts-ignore
  const l = result[result.length-1][1]+1
  //@ts-ignore
  result.push([l, (l===max)?max+1:max]) 
  return result;
}

// (FIX) infinate is defined as undefined
export const getEmailStatusFromApolloURL = (url: string): string[] => {
  const pURL = new URLSearchParams(url.split('/#/people?')[1]);
  const status = pURL.getAll('contactEmailStatus[]')
  if (!status.length) return []
  return status
}

export const setEmailStatusInApolloURL = (url: string, status: string) => {
  if (!url.includes('/#/people?')) return url
  const params = new URLSearchParams(url.split('/#/people?')[1]);
  params.append('contactEmailStatus[]', status)
  return decodeURI(`${url.split('?')[0]}?${params.toString()}`)
}


export const removeEmailStatusInApolloURL = (url: string, status: string) => {
  const s = `contactEmailStatus[]=${status}`;
  const b = '&' + s;
  const f = s + '&';
  let u = url;

  if (url.includes(b)) {
    u = url.replace(b, '')
  } else if (url.includes(f)) {
    u = url.replace(f, '')
  } else {
    u = url.replace(s, '')
  }

  return u
}

export const getLeadColFromApolloURL = (url: string): string => {
  const pURL = new URLSearchParams(url.split('/#/people?')[1]);
  const col = pURL.getAll('prospectedByCurrentTeam[]')
  if (!col.length) return ''
  return col[0]
}

export const setLeadColInApolloURL = (url: string, col: string) => {
  if (!url.includes('/#/people?')) return url
  const params = new URLSearchParams(url.split('/#/people?')[1]);
  params.set('prospectedByCurrentTeam[]', col)
  return decodeURI(`${url.split('?')[0]}?${params.toString()}`)
}

export const removeLeadColInApolloURL = (url: string) => {
  if (!url.includes('/#/people?')) return url
  const params = new URLSearchParams(url.split('/#/people?')[1]);
  params.delete('prospectedByCurrentTeam[]')
  return decodeURI(`${url.split('?')[0]}?${params.toString()}`)
}

