import { Dispatch, SetStateAction } from "react";
import { IoMdClose } from "react-icons/io";

type Props = {
  getLoginCookie: () => void
  setPopup: Dispatch<SetStateAction<number | null>>
}

export const AccountPopup = ({setPopup, getLoginCookie}: Props) => {

  const handleClose = () => {
    setPopup(null)
  }

  return (
    <div className="flex items-center justify-center fixed top-0 left-0 right-0 bottom-0 z-10" style={{background: "rgba(0,0,0,.70)"}} onClick={handleClose}>
      <div className="relative w-[30%] h-[30%] z-20 border-cyan-600 border-2 bg-black" onClick={e => e.stopPropagation()}>
        <IoMdClose className='absolute top-0 right-0 bg-cyan-600' onClick={handleClose}/>
        <button onClick={getLoginCookie}>Login</button>
        <button>Delete</button>
      </div>
    </div>
  )
}