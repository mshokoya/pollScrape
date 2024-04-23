// import { Spinner } from './Spinner'

export const cloneObject = (a: Record<any, any> | any[]) => {
  return JSON.parse(JSON.stringify(a))
}
