import { blinkCSS, fetchData } from "../core/util";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { IAccount } from "./AccountField";

type ReqType = 'check' | 'login' | 'update' | 'manualLogin'  | 'manualUpgrade' | 'mines' | 'upgrade' | 'delete'

type Props = {
  login: () => Promise<void>
  checkAccount: () => Promise<void>
  updateAccount: (acc: Partial<IAccount>) => Promise<void>
  manualLogin: () => Promise<void>
  upgradeAccount: () => Promise<void>
  manualUpgradeAccount: () => Promise<void>
  deleteAccount: () => Promise<void>
  clearMines: () => Promise<void>
  setPopup: Dispatch<SetStateAction<number | null>>
  account: IAccount
  reqInProcess: string[]
  setReqInProcess?: Dispatch<SetStateAction<string[]>>
  req:  string | null
}

export const AccountPopup = ( props : Props) => {

  const [input, setInput] = useState<Partial<IAccount>>({email: props.account.email, password: props.account.password, recoveryEmail: props.account.recoveryEmail});

  const handleClose = () => props.setPopup(null)

  const handleRequest = async (h: ReqType) => {
    switch(h) {
      case 'login':
        await props.login()
        break
      case 'check':
        await props.checkAccount()
        break
      case 'update':
        await props.updateAccount(input)
        break
      case 'manualLogin':
        await props.manualLogin()
        break
      case 'manualUpgrade':
        await props.checkAccount()
        break
      case 'upgrade':
        await props.upgradeAccount()
        break
      case 'mines':
        await props.clearMines()
        break
      case 'delete':
        await props.clearMines()
        break
    }
  }

  return (
    <div className="flex items-center justify-center fixed top-0 left-0 right-0 bottom-0 z-10" style={{background: "rgba(0,0,0,.70)"}} onClick={handleClose}>
      <div className="relative w-[30%] h-[30%] z-20 border-cyan-600 border-2 bg-black flex flex-col" onClick={e => e.stopPropagation()}>
        <IoMdClose className='absolute top-0 right-0 bg-cyan-600' onClick={handleClose}/>

        <div className='text-center border-b-2 border-cyan-600 mb-2'>
          <h1>
            <span className='text-cyan-600'>{props.account.domainEmail || ''}</span> Settings
          </h1>
        </div>

        {/* (FIX) reqInProcess on in onclick func
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
        </div> */}

        <div>
          <button 
            disabled={props.reqInProcess.includes(props.account._id)}
            className={blinkCSS(props.req === 'login')}
            onClick={() => {handleRequest('login')}} >Login to Account</button>
        </div>

        <div>
          <button 
            disabled={props.reqInProcess.includes(props.account._id)}
            className={blinkCSS(props.req === 'check')}
            onClick={() => {handleRequest('check')}}>Check Account</button>
        </div>

        <div>
          <button 
            disabled={props.reqInProcess.includes(props.account._id)} 
            className={blinkCSS(props.req === 'update')}
            onClick={() => {handleRequest('update')}}>Update Account</button>
        </div>

        <div>
          <button 
            disabled={props.reqInProcess.includes(props.account._id)}
            className={blinkCSS(props.req === 'upgrade')}
            onClick={() => {handleRequest('upgrade')}}>upgrade Account</button>
        </div>

        <div>
          <button 
            disabled={props.reqInProcess.includes(props.account._id)}
            className={blinkCSS(props.req === 'manualUpgrade')}
            onClick={() => {handleRequest('manualUpgrade')}}>manually upgrade Account</button>
        </div>

        <div>
          <button 
            disabled={props.reqInProcess.includes(props.account._id)} 
            className={blinkCSS(props.req === 'mines')}
            onClick={() => {handleRequest('mines')}}>Clear Mines</button>
        </div>

        <div>
          <button 
            disabled={props.reqInProcess.includes(props.account._id)}
            className={blinkCSS(props.req === 'delete')}
            onClick={() => {handleRequest('delete')}}>Delete</button>
        </div>

      </div>
    </div>
  )
}