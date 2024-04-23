// import { Spinner } from './Spinner'

type ISpin = {
  show?: boolean
  classs?: string
}

export const Spin = ({ show, classs }: ISpin) => (
  <span className="w-5 h-5"> {show ? <div classs={classs} /> : ''} </span>
)

export const cloneObject = (a: Record<any, any> | any[]) => {
  return JSON.parse(JSON.stringify(a))
}
