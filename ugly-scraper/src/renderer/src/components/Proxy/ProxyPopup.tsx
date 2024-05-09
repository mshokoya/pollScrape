import { Dispatch, SetStateAction, useState } from 'react'
import { IoMdClose } from 'react-icons/io'
import { fetchData } from '../core/util'
import { IProxy } from './ProxyField'

type Props = {
  setPopup: Dispatch<SetStateAction<number | null>>
  proxy: IProxy
}

export const ProxyPopup = ({ setPopup, proxy }: Props) => {
  const [reqInProcess, setReqInProcess] = useState(false)

  const handleClose = () => setPopup(null)

  const checkProxy = () => {
    setReqInProcess(true)
    fetchData(`/proxy/check/${proxy.id}`, 'GET')
      .then(() => {
        console.log('success')
      })
      .catch(() => {
        console.log('failed')
      })
      .finally(() => {
        setReqInProcess(false)
      })
  }

  // create warning popup
  const deleteProxy = () => {
    setReqInProcess(true)
    fetchData('/meta/delete', 'PUT', { id: proxy.id })
      .then(() => {
        console.log('success')
      })
      .catch(() => {
        console.log('failed')
      })
      .finally(() => {
        setReqInProcess(false)
      })
  }

  return (
    <div
      className="flex items-center justify-center fixed top-0 left-0 right-0 bottom-0 z-10"
      style={{ background: 'rgba(0,0,0,.70)' }}
      onClick={handleClose}
    >
      <div
        className="relative w-[30%] h-[30%] z-20 border-cyan-600 border-2 bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        <IoMdClose className="absolute top-0 right-0 bg-cyan-600" onClick={handleClose} />
        <div>
          <button disabled={reqInProcess} onClick={checkProxy}>
            Check Proxy
          </button>
        </div>

        <div>
          <button disabled={reqInProcess} onClick={deleteProxy}>
            Delete Proxy
          </button>
        </div>
      </div>
    </div>
  )
}
