import { Dispatch, SetStateAction, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { IMetaData } from "./RecordField";
import { fetchData } from "../core/util";

type Props = {
  setPopup: Dispatch<SetStateAction<number | null>>
  meta: IMetaData;
}

export const MetaPopup = ({setPopup, meta}: Props) => {
  const [rename, setRename] = useState(meta.name);
  const [reqInProcess, setReqInProcess] = useState(false)

  const handleClose = () => setPopup(null)

  // move to meta func because id popup closed state is lost
  const submitChange = () => {
    if (rename === meta.name) return;
    setReqInProcess(true)
    fetchData('/meta', 'PUT', {id: meta._id, name: rename})
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

  const continueScraping = () => {
    setReqInProcess(true)
    fetchData('/scrape', 'POST', {meta})
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
  const deleteAccount = () => {
    setReqInProcess(true)
    fetchData('/meta/delete', 'PUT', {id: meta._id})
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
    <div className="flex items-center justify-center fixed top-0 left-0 right-0 bottom-0 z-10" style={{background: "rgba(0,0,0,.70)"}} onClick={handleClose}>
      <div className="relative w-[30%] h-[30%] z-20 border-cyan-600 border-2 bg-black" onClick={e => e.stopPropagation()}>
        <IoMdClose className='absolute top-0 right-0 bg-cyan-600' onClick={handleClose}/>

        <div>
          <input value={rename} onChange={e => setRename(e.target.value)}/>
          <button disabled={reqInProcess} onClick={submitChange}>Rename Account</button>
        </div>

        <div>
          <button disabled={reqInProcess} onClick={continueScraping}>continue scraping</button>
        </div>

        <div>
        <button disabled={reqInProcess} onClick={deleteAccount}>Delete Account</button>
        </div>
      </div>
    </div>
  )
}