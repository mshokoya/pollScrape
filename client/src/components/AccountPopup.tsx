import { Dispatch, SetStateAction } from "react"
import { fetchData } from "../core/util"
import { IAccount } from "./AccountField"
import { IoMdClose } from "react-icons/io";

type Props = {
  account: IAccount
  setPopup: Dispatch<SetStateAction<number | null>>
}

export const AccountPopup = ({account, setPopup}: Props) => {

  const handleClose = () => {
    setPopup(null)
  }

  const handleClick = () => {
    fetchData('/account/cookies', 'POST', {account})
  }

  return (
    <div className="flex items-center justify-center fixed top-0 left-0 right-0 bottom-0 z-10" style={{background: "rgba(0,0,0,.70)"}} onClick={handleClose}>
      <div className="relative w-[30%] h-[30%] z-20 border-cyan-600 border-2 bg-black" onClick={e => e.stopPropagation()}>
        <IoMdClose className='absolute top-0 right-0 bg-cyan-600' onClick={handleClose}/>
        <button onClick={handleClick}>Login</button>
        <button>Delete</button>
      </div>
    </div>
  )
}