import { blinkCSS } from "../core/util";
import { Dispatch, SetStateAction, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { IAccount, ReqType } from "./AccountField";


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

type Page = 'main' | 'update'


export const AccountPopup = ( props : Props) => {
// {email: props.account.email, password: props.account.password, recoveryEmail: props.account.recoveryEmail}
  const [input, setInput] = useState<Partial<IAccount>>({...props.account});
  const [page, setPage] = useState<Page>('main')

  const handleClose = () => props.setPopup(null)

  const resetFields = () => setInput({...props.account})

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
        await props.manualUpgradeAccount()
        break
      case 'upgrade':
        await props.upgradeAccount()
        break
      case 'mines':
        await props.clearMines()
        break
      case 'delete':
        await props.deleteAccount()
        break
    }
  }

  return (
    <div className="flex items-center justify-center fixed top-0 left-0 right-0 bottom-0 z-10" style={{background: "rgba(0,0,0,.70)"}} onClick={handleClose}>
      <div className="relative w-[30%] h-[30%] z-20 border-cyan-600 border-2 bg-black flex flex-col" onClick={e => e.stopPropagation()}>
        <IoMdClose className='absolute top-0 right-0 bg-cyan-600' onClick={handleClose}/>
        {
          page === 'update'
            ? <UpdateFields 
                input={input}
                setInput={setInput}
                handleRequest={handleRequest}
                setPage={setPage}
                resetFields={resetFields}
              />
            : <MainFields 
                {...props} 
                handleRequest={handleRequest} 
                setPage={setPage}
              /> 
        }
      </div>
    </div>
  )
}

type MProps = {
  handleRequest: (a: ReqType) => Promise<void>
  setPage: Dispatch<SetStateAction<Page>>
} & Props 

export const MainFields = (props: MProps) => {

  return (
    <>
      <div className='text-center border-b-2 border-cyan-600 mb-2'>
        <h1>
          <span className='text-cyan-600'>{props.account.domainEmail || ''}</span> Settings
        </h1>
      </div>

      <div>
        <button 
          disabled={props.reqInProcess.includes(props.account._id)}
          className={blinkCSS(props.req === 'login')}
          onClick={() => {props.handleRequest('login')}} >Login to Account</button>
      </div>

      <div>
        <button 
          disabled={props.reqInProcess.includes(props.account._id)}
          className={blinkCSS(props.req === 'check')}
          onClick={() => {props.handleRequest('check')}}>Check Account</button>
      </div>

      <div>
        <button 
          disabled={props.reqInProcess.includes(props.account._id)} 
          className={blinkCSS(props.req === 'update')}
          onClick={() => {props.setPage('update')}}>Update Account</button>
      </div>

      <div>
        <button 
          disabled={props.reqInProcess.includes(props.account._id)}
          className={blinkCSS(props.req === 'upgrade')}
          onClick={() => {props.handleRequest('upgrade')}}>upgrade Account</button>
      </div>

      <div>
        <button 
          disabled={props.reqInProcess.includes(props.account._id)}
          className={blinkCSS(props.req === 'manualUpgrade')}
          onClick={() => {props.handleRequest('manualUpgrade')}}>manually upgrade Account</button>
      </div>

      <div>
        <button 
          disabled={props.reqInProcess.includes(props.account._id)} 
          className={blinkCSS(props.req === 'mines')}
          onClick={() => {props.handleRequest('mines')}}>Clear Mines</button>
      </div>

      <div>
        <button 
          disabled={props.reqInProcess.includes(props.account._id)}
          className={blinkCSS(props.req === 'delete')}
          onClick={() => {props.handleRequest('delete')}}>Delete</button>
      </div>
    </>
  )
}



// ===============================================

type UFProps = {
  input: Partial<IAccount>
  setInput: Dispatch<SetStateAction<Partial<IAccount>>>
  setPage: Dispatch<SetStateAction<Page>>
  handleRequest: (input: ReqType) => Promise<void>
  resetFields: () => void
}

export const UpdateFields = ({input, setInput, handleRequest, resetFields, setPage}: UFProps) => {

  const backToMain = () => {
    resetFields()
    setPage('main')
  }

  return (
    <>
      <div onClick={backToMain}>Go Back</div> 
      <form onSubmit={() => {handleRequest('update')}}>
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
          <input type="text" id="recovery" value={input.recoveryEmail} onChange={ e => {setInput(p => ({...p, recoveryEmail: e.target.value}))}}/>
        </div>

        <input className='text-cyan-600 border-cyan-600 border rounded p-1 mt-3' type="submit" value="Update Account"/>
        <button 
          type='button'
          className='text-cyan-600 border-cyan-600 border rounded p-1 mt-3'
          onClick={resetFields}
        >Reset fields</button>
      </form>
    </>
  )
}