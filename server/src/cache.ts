import { Mutex } from 'async-mutex';

export const cache = (() => {
  const _CLock = new Mutex()
  const c: {[key: string]: any} = {}

  return {
    get: async (key: string) => await _CLock.runExclusive(() => c[key]),
    set: async (key: string, value: any) => await _CLock.runExclusive(() => {c[key] = value; return true}),
  }
})()