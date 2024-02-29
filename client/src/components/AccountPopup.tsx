import { IoMdClose } from "react-icons/io";
import { useObservable } from "@legendapp/state/react";
import { Observable, ObservableObject, batch } from "@legendapp/state";
import { AccountReqType, IAccount, accountTaskHelper } from "../core/state/account";
import { blinkCSS } from "../core/util";
import { Spin } from "./util";


type Props = {
  login: () => Promise<void>
  checkAccount: () => Promise<void>
  updateAccount: (acc: Partial<IAccount>) => Promise<void>
  manualLogin: () => Promise<void>
  upgradeAccount: () => Promise<void>
  manualUpgradeAccount: () => Promise<void>
  deleteAccount: () => Promise<void>
  clearMines: () => Promise<void>
  confirmAccount: () => Promise<void>
  setPopup: (idx: number | null) => void
  account: IAccount
  req:  string | null
}

type Page = 'main' | 'update'

type State = {input: IAccount, page: Page}

export const AccountPopup = ( p : Props) => {
  const obs = useObservable<State>({ input: {...p.account}, page: 'main'})
  const handleClose = () => p.setPopup(null)

  const handleRequest = async (h: AccountReqType) => {
    switch(h) {
      case 'login':
        await p.login()
        break
      case 'check':
        await p.checkAccount()
        break
      case 'update':
        await p.updateAccount(obs.input.get())
        break
      case 'manualLogin':
        await p.manualLogin()
        break
      case 'manualUpgrade':
        await p.manualUpgradeAccount()
        break
      case 'upgrade':
        await p.upgradeAccount()
        break
      case 'mines':
        await p.clearMines()
        break
      case 'delete':
        await p.deleteAccount()
        break
      case 'confirm':
        await p.confirmAccount()
        break
    }
  }

  return (
    <div className="flex items-center justify-center fixed top-0 left-0 right-0 bottom-0 z-10" style={{background: "rgba(0,0,0,.70)"}} onClick={handleClose}>
      <div className="relative w-[30%] h-[30%] z-20 border-cyan-600 border-2 bg-black flex flex-col" onClick={e => e.stopPropagation()}>
        <IoMdClose className='absolute top-0 right-0 bg-cyan-600' onClick={handleClose}/>
        <div className='text-center border-b-2 border-cyan-600 mb-2'>
          <h1>
            <span className='text-cyan-600'>{p.account.domainEmail || ''}</span> Settings
          </h1>
        </div>
        {
          obs.page.get() === 'update'
            ? <UpdateFields 
                handleRequest={handleRequest}
                obs={obs}
                account={p.account}
              />
            : <MainFields 
                {...p} 
                handleRequest={handleRequest} 
                obs={obs}
              /> 
        }
      </div>
    </div>
  )
}

type MProps = {
  handleRequest: (a: AccountReqType) => Promise<void>
  obs: ObservableObject<State>
  account: IAccount
} & Props

export const MainFields = (p: MProps) => {
  const isLoginReq = !!accountTaskHelper.findTaskByReqType(p.account._id, 'login')
  const isCheckReq = !!accountTaskHelper.findTaskByReqType(p.account._id, 'check')
  const isUpdateReq = !!accountTaskHelper.findTaskByReqType(p.account._id, 'update')
  const isManUpgradeReq = !!accountTaskHelper.findTaskByReqType(p.account._id, 'manualUpgrade')
  const isManLoginReq = !!accountTaskHelper.findTaskByReqType(p.account._id, 'manualLogin')
  const isUpgradeReq = !!accountTaskHelper.findTaskByReqType(p.account._id, 'upgrade')
  const isMinesReq = !!accountTaskHelper.findTaskByReqType(p.account._id, 'mines')
  const isDeleteReq = !!accountTaskHelper.findTaskByReqType(p.account._id, 'delete')
  const isConfirmReq = !!accountTaskHelper.findTaskByReqType(p.account._id, 'confirm')

  return (
    <>
      <div>
        <button 
          disabled={isLoginReq}
          className={blinkCSS(isLoginReq)}
          onClick={() => {p.handleRequest('login')}} >Login to Account</button>
          <Spin show={isLoginReq}/>
      </div>

      <div>
        <button 
          disabled={isManLoginReq}
          className={blinkCSS(isManLoginReq)}
          onClick={() => {p.handleRequest('manualLogin')}} >Login to Account Manually</button>
          <Spin show={isManLoginReq}/>
      </div>

      <div>
        <button 
          disabled={isCheckReq}
          className={blinkCSS(isCheckReq)}
          onClick={() => {p.handleRequest('check')}}>Check Account</button>
          <Spin show={isCheckReq}/>
      </div>

      <div>
        <button 
          disabled={isUpdateReq}
          className={blinkCSS(isUpdateReq)}
          onClick={() => {p.obs.page.set('update')}}>Update Account</button>
          <Spin show={isUpdateReq}/>
      </div>

      <div>
        <button 
          disabled={isUpgradeReq}
          className={blinkCSS(isUpgradeReq)}
          onClick={() => {p.handleRequest('upgrade')}}>upgrade Account</button>
          <Spin show={isUpgradeReq}/>
      </div>

      <div>
        <button 
          disabled={isManUpgradeReq}
          className={blinkCSS(isManUpgradeReq)}
          onClick={() => {p.handleRequest('manualUpgrade')}}>manually upgrade Account</button>
          <Spin show={isManUpgradeReq}/>
      </div>

      <div>
        <button 
          disabled={isMinesReq}
          className={blinkCSS(isMinesReq)}
          onClick={() => {p.handleRequest('mines')}}>Clear Mines</button>
          <Spin show={isMinesReq}/>
      </div>

      <div>
        <button 
          disabled={isConfirmReq}
          className={blinkCSS(isConfirmReq)}
          onClick={() => {p.handleRequest('confirm')}}>Confirm Account</button>
          <Spin show={isConfirmReq}/>
      </div>

      <div>
        <button 
          disabled={isDeleteReq}
          className={blinkCSS(isDeleteReq)}
          onClick={() => {p.handleRequest('delete')}}>Delete Account</button>
          <Spin show={isDeleteReq}/>
      </div>
    </>
  )
}


// ===============================================


type UFProps = {
  handleRequest: (input: AccountReqType) => Promise<void>
  obs: Observable<State>
  account: IAccount
}

export const UpdateFields = ({obs, handleRequest, account}: UFProps) => {

  const backToMain = () => {
    batch(() => {
      obs.input.set(account)
      obs.page.set('main')
    })
  }

  return (
    <>
      <div onClick={backToMain}>Go Back</div> 
      <form onSubmit={() => {handleRequest('update')}}>
        <div className='mb-3'>
          <label className='mr-2 border-cyan-600 border-b-2' htmlFor="email">Email:</label>
          <input required type="text" id="email" value={obs.input.email.get()} onChange={ e => {obs.input.set(p => ({...p, email: e.target.value}))}}/>
        </div>

        <div className='mb-3'>
          <label className='mr-2 border-cyan-600 border-b-2' htmlFor="password">Password:</label>
          <input required type="text" id="password" value={obs.input.password.get()} onChange={ e => {obs.input.set(p => ({...p, password: e.target.value}))}}/>
        </div>

        <div className='mb-3'>
          <label className='mr-2 border-cyan-600 border-b-2' htmlFor="domain">Domain Email:</label>
          <input type="text" id="domain" value={obs.input.domainEmail.get()} onChange={ e => {obs.input.set(p => ({...p, domainEmail: e.target.value}))}}/>
        </div>

        <div className='mb-3'>
          <label className='mr-2 border-cyan-600 border-b-2' htmlFor="recovery">RecoveryEmail:</label>
          <input type="text" id="recovery" value={obs.input.recoveryEmail.get()} onChange={ e => {obs.input.set(p => ({...p, recoveryEmail: e.target.value}))}}/>
        </div>

        <input className='text-cyan-600 border-cyan-600 border rounded p-1 mt-3' type="submit" value="Update Account"/>
        <button 
          type='button'
          className='text-cyan-600 border-cyan-600 border rounded p-1 mt-3'
          onClick={() => { obs.input.set(account) }}
        >Reset fields</button>
      </form>
    </>
  )
}