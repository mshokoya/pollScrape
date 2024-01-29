import { fetchData } from "../core/util";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { IAccount } from "./AccountField";

type Props = {
  getLoginCookie: () => void
  setPopup: Dispatch<SetStateAction<number | null>>
  account: IAccount
}

export const AccountPopup = ({setPopup, getLoginCookie, account}: Props) => {
  const [reqInProcess, setReqInProcess] = useState(false)
  const [input, setInput] = useState({email: account.email, password: account.password, recovery: account.recoveryEmail});

  const handleClose = () => {
    setPopup(null)
  }

  const checkAccount = async () => {
    setReqInProcess(true)
    await fetchData(`/account/check/${account._id}`, 'GET')
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        setReqInProcess(false)
      })
  }

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await fetchData('/account', 'PUT', input)
      .then((d) => {
        console.log('account post')
        console.log(d)
      })
  }

  const manualLogin = async () => {
    setReqInProcess(true)
    await fetchData(`/account/login/m/${account._id}`, 'GET')
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        setReqInProcess(false)
      })
  }

  const verifyAccount = async () => {
    setReqInProcess(true)
    await fetchData(`/account/verify/${account._id}`, 'GET')
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        setReqInProcess(false)
      })
  }

  const upgradeAccount = async () => {
    setReqInProcess(true)
    await  fetchData(`/account/upgrade/a/${account._id}`, 'GET')
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        setReqInProcess(false)
      })
  }

  const MupgradeAccount = async () => {
    setReqInProcess(true)
    await  fetchData(`/account/upgrade/m/${account._id}`, 'GET')
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        setReqInProcess(false)
      })
  }

  const clearMines = async () => {
    setReqInProcess(true)
    await  fetchData(`/account/mines/${account._id}`, 'GET')
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        setReqInProcess(false)
      })
  }

  return (
    <div className="flex items-center justify-center fixed top-0 left-0 right-0 bottom-0 z-10" style={{background: "rgba(0,0,0,.70)"}} onClick={handleClose}>
      <div className="relative w-[30%] h-[30%] z-20 border-cyan-600 border-2 bg-black" onClick={e => e.stopPropagation()}>
        <IoMdClose className='absolute top-0 right-0 bg-cyan-600' onClick={handleClose}/>

        {/* (FIX) reqInProcess on in onclick func */}
        <div>
          <form onSubmit={handleUpdate}>
            <div className='mb-3'>
              <label className='mr-2 border-cyan-600 border-b-2' htmlFor="email">Email:</label>
              <input required type="text" id="email" value={input.email} onChange={ e => {setInput(p => ({...p, email: e.target.value}))}}/>
            </div>

            <div className='mb-3'>
              <label className='mr-2 border-cyan-600 border-b-2' htmlFor="password">Password:</label>
              <input required type="text" id="password" value={input.password} onChange={ e => {setInput(p => ({...p, password: e.target.value}))}}/>
            </div>

            <div className='mb-3'>
              <label className='mr-2 border-cyan-600 border-b-2' htmlFor="recovery">RecoveryEmail:</label>
              <input type="text" id="recovery" value={input.recovery} onChange={ e => {setInput(p => ({...p, recovery: e.target.value}))}}/>
            </div>

            <input className='text-cyan-600 border-cyan-600 border rounded p-1 mt-3' type="submit" value="Add Account"/>
          </form>
        </div>

        <div>
          <button disabled={reqInProcess} onClick={getLoginCookie}>Login to Account</button>
        </div>

        <div>
          <button disabled={reqInProcess} onClick={checkAccount}>Check Account</button>
        </div>

        <div>
          <button disabled={reqInProcess} onClick={manualLogin}>Login Manually</button>
        </div>

        <div>
          <button disabled={reqInProcess} onClick={verifyAccount}>Verify Account</button>
        </div>

        <div>
          <button disabled={reqInProcess} onClick={upgradeAccount}>upgrade Account</button>
        </div>

        <div>
          <button disabled={reqInProcess} onClick={MupgradeAccount}>manually upgrade Account</button>
        </div>

        <div>
          <button disabled={reqInProcess} onClick={clearMines}>Clear Mines</button>
        </div>

        <div>
          <button disabled={reqInProcess}>Delete</button>
        </div>

      </div>
    </div>
  )
}