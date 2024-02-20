import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { observable } from "@legendapp/state";
import { IAccount } from "@/components/AccountField";
import { IDomain } from "@/components/DomainField";
import { IProxy } from "@/components/ProxyField";
import { IMetaData, IRecord } from "@/components/RecordField";

export type ResStatus = [string, id:string] | null

type AppState = {
  accounts: IAccount[]
  domains: IDomain[]
  proxies: IProxy[]
  metas: IMetaData[]
  records: IRecord[]
}

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