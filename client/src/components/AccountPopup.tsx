import { IoMdClose } from "react-icons/io";
import { observer, useObservable } from "@legendapp/state/react";
import { Observable, ObservableObject, batch } from "@legendapp/state";
import { AccountReqType, IAccount, stateHelper } from "../core/state/account";


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

export const AccountPopup = observer(( props : Props) => {
  const obs = useObservable<State>({ input: {...props.account}, page: 'main'})
  const handleClose = () => props.setPopup(null)

  const handleRequest = async (h: AccountReqType) => {
    switch(h) {
      case 'login':
        await props.login()
        break
      case 'check':
        await props.checkAccount()
        break
      case 'update':
        await props.updateAccount(obs.input.get())
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
      case 'confirm':
        await props.confirmAccount()
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
        {
          obs.page.get() === 'update'
            ? <UpdateFields 
                handleRequest={handleRequest}
                obs={obs}
                account={props.account}
              />
            : <MainFields 
                {...props} 
                handleRequest={handleRequest} 
                obs={obs}
              /> 
        }
      </div>
    </div>
  )
})

type MProps = {
  handleRequest: (a: AccountReqType) => Promise<void>
  obs: ObservableObject<State>
  account: IAccount
} & Props 

export const MainFields = observer((props: MProps) => {

  return (
    <>
      <div>
        <button 
          // className={blinkCSS(props.req === 'login')}
          onClick={() => {props.handleRequest('login')}} >Login to Account</button>
      </div>

      <div>
        <button 
          // className={blinkCSS(props.req === 'check')}
          onClick={() => {props.handleRequest('check')}}>Check Account</button>
      </div>

      <div>
        <button 
          disabled={stateHelper.doesEntityHaveRIP(props.account._id)}
          // className={blinkCSS(props.req === 'update')}
          onClick={() => {props.obs.page.set('update')}}>Update Account</button>
      </div>

      <div>
        <button 
          // className={blinkCSS(props.req === 'upgrade')}
          onClick={() => {props.handleRequest('upgrade')}}>upgrade Account</button>
      </div>

      <div>
        <button 
          // className={blinkCSS(props.req === 'manualUpgrade')}
          onClick={() => {props.handleRequest('manualUpgrade')}}>manually upgrade Account</button>
      </div>

      <div>
        <button 
          // className={blinkCSS(props.req === 'mines')}
          onClick={() => {props.handleRequest('mines')}}>Clear Mines</button>
      </div>

      <div>
        <button 
          // className={blinkCSS(props.req === 'confirm')}
          onClick={() => {props.handleRequest('confirm')}}>Confirm Account</button>
      </div>

      <div>
        <button 
          disabled={!stateHelper.isEntityPiplineEmpty(props.account._id)}
          // className={blinkCSS(props.req === 'delete')}
          onClick={() => {props.handleRequest('delete')}}>Delete Account</button>
      </div>
    </>
  )
})

// ===============================================

type UFProps = {
  handleRequest: (input: AccountReqType) => Promise<void>
  obs: Observable<State>
  account: IAccount
}

export const UpdateFields = observer(({obs, handleRequest, account}: UFProps) => {

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
})