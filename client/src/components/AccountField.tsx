import { FormEvent, MouseEvent, useState } from "react"
import { ResStatusHelpers, TaskHelpers, fetchData} from '../core/util';
import { SlOptionsVertical } from "react-icons/sl";
import { IoOptionsOutline } from "react-icons/io5";
import { AccountPopup } from "./AccountPopup";
import { IDomain } from "./DomainField";
import { observer, useSelector } from "@legendapp/state/react";
import { Observable, ObservableObject, batch } from "@legendapp/state";
import { accountState, stateHelper, stateResStatusHelper, IAccount, AccountReqType } from "../core/state/apollo";
import { appState$ } from "../core/state";


export const AccountField = observer(() => {
  const accounts = useSelector(appState$.accounts) as IAccount[]
  const domains = useSelector(appState$.domains) as IDomain[]

  const s = accountState

  const handleExtendRow = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    //@ts-ignore
    const type = e.target.closest('td')?.dataset.type as string

    switch (type) {
      case 'opt':
        //@ts-ignore
        const accIdx = e.target.closest('tr').dataset.idx;
        s.selectedAcc.set(accIdx)
        break;
      case 'extend':
        //@ts-ignore
        e.target.closest('tr').nextSibling.classList.toggle('hidden')
        //@ts-ignore
        e.target.closest('tr').nextSibling.firstElementChild?.classList.toggle('hidden')
        break;
    }
  }

  // (FIX) email verification + get domain to determine login type
  const addAccount = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await fetchData<IAccount>('/account', 'POST', {...s.input.peek(), addType: s.addType.peek(), selectedDomain: s.selectedDomain.peek()})
  }

  const login = async () => {
    // s.reqType.set('login')
    const selectedAcc = s.selectedAcc.peek()
    const accountID = accounts[selectedAcc]._id
    await fetchData(`/account/login/a/${accountID}`, 'GET')
  }

  const manualLogin = async () => {
    // s.reqType.set('manualLogin')
    const selectedAcc = s.selectedAcc.peek()
    const accountID = accounts[selectedAcc]._id
    await fetchData(`/account/login/m/${accountID}`, 'GET')
  }

  const checkAccount = async () => {
    // s.reqType.set('check')
    const selectedAcc = s.selectedAcc.peek()
    const accountID = accounts[selectedAcc]._id
    await fetchData(`/account/check/${accountID}`, 'GET')
  }

  const updateAccount = async (acc: Partial<IAccount>) => {
    // s.reqType.set('update')
    const selectedAcc = s.selectedAcc.get()
    const accountID = accounts[selectedAcc]._id
    if (!stateHelper.isEntityPiplineEmpty(accountID)) return;

    stateHelper.add(accountID, {status: 'processing', type: 'update'})
    
    await fetchData<IAccount>(`/account/${accountID}`, 'PUT', acc)
      .then((data) => {
        if (data.ok) {
          stateResStatusHelper.add(accountID, ['update', 'ok'])
          appState$.accounts.set(a1 => a1.map(a2 => a2._id === accountID ? data.data : a2))
        } else {
          stateResStatusHelper.add(accountID, ['update', 'fail'])
        }
      })
      .catch(() => { stateResStatusHelper.add(accountID, ['update', 'fail']) })
      .finally(() => {
        setTimeout(() => {
          batch(() => {
            stateHelper.deleteTaskByReqType(accountID, 'update')
            stateResStatusHelper.delete(accountID, 'update')
          })
        }, 1500)
      })
  }

  const upgradeAccount = async () => {
    // s.reqType.set('upgrade')
    const selectedAcc = s.selectedAcc.get()
    const accountID = accounts[selectedAcc]._id
    await  fetchData(`/account/upgrade/a/${accountID}`, 'GET')
  }

  const manualUpgradeAccount = async () => {
    // s.reqType.set('manualUpgrade')
    const selectedAcc = s.selectedAcc.get()
    const accountID = accounts[selectedAcc]._id
    await fetchData(`/account/upgrade/m/${accountID}`, 'GET')
  }

  const clearMines = async () => {
    // s.reqType.set('mines')
    const selectedAcc = s.selectedAcc.get()
    const accountID = accounts[selectedAcc]._id
    await fetchData(`/account/demine/${accountID}`, 'GET')
  }

  const confirmAccount = async () => {
    // s.reqType.set('confirm')
    const selectedAcc = s.selectedAcc.get()
    const accountID = accounts[selectedAcc]._id
    await fetchData(`/account/confirm/${accountID}`, 'GET')
  }

  // (FIX) complete func (dont delete, just archive)
  const deleteAccount = async () => {
    const selectedAcc = s.selectedAcc.get()
    const accountID = accounts[selectedAcc]._id
    if (!stateHelper.isEntityPiplineEmpty(accountID)) return;

    stateHelper.add(accountID, {status: 'processing', type: 'delete'})

    await fetchData<IAccount>(`/account/${accountID}`, 'DELETE')
      .then((data) => {
        batch(() => {
          data.ok
            ? stateResStatusHelper.add(accountID, ['delete', 'ok'])
            : stateResStatusHelper.add(accountID, ['delete', 'fail'])
          appState$.accounts.set(a1 => a1.filter( a2 => a2._id !== accountID))
        })
      })
      .catch(() => { stateResStatusHelper.add(accountID, ['delete', 'fail']) })
      .finally(() => {
        setTimeout(() => {
          batch(() => {
            stateHelper.deleteTaskByReqType(accountID, 'delete')
            stateResStatusHelper.delete(accountID, 'delete')
          })
        }, 1500)
      })
  }

  const fmtDate = (n: any) => n.toDateString
      ? n.toDateString()
      : n;

  const setPopup = (v: number | null) => {s.selectedAcc.set(v)}

  const PopupComp = () => s.selectedAcc.get()
      ? <AccountPopup
          req={s.reqType.peek()}
          manualLogin={manualLogin}
          updateAccount={updateAccount}
          setPopup={setPopup}
          checkAccount={checkAccount}
          login={login}
          deleteAccount={deleteAccount}
          clearMines={clearMines}
          upgradeAccount={upgradeAccount}
          manualUpgradeAccount={manualUpgradeAccount}
          account={accounts[s.selectedAcc.peek()]}
          confirmAccount={confirmAccount}
        />
      : null;


  return (
    <>
    <PopupComp />
    <div className="flex relative grow text-xs">
      <div className="flex flex-col grow absolute inset-x-0 inset-y-0">
        <div className='flex mt-1 mb-3 gap-3'>
          <button
            className='text-cyan-600 border-cyan-600 border rounded p-1'
            onClick={() => s.addType.set('email')}
          >
            email
          </button>

          <button
            className='text-cyan-600 border-cyan-600 border rounded p-1'
            onClick={() => s.addType.set('domain')}
          >
            domain
          </button>
        </div>


        <div className='mb-2'>
          {
            s.addType.get() === 'email'
              ? <EmailForm
                  input={s.input}
                  addAccount={addAccount}
                  stateHelper={stateHelper}
                  stateResStatusHelper={stateResStatusHelper}
                />
              : <DomainForm
                  domains={domains}
                  addAccount={addAccount}
                  stateHelper={stateHelper}
                  stateResStatusHelper={stateResStatusHelper}
                  selectedDomain={s.selectedDomain}
                />
          }
        </div>

        <div className='border-cyan-600 border rounded grow overflow-auto'>
          <table className="text-[0.7rem] font-light m-auto table-fixed w-[120%]">
            <thead className='sticky top-0 bg-black'>
              <tr>
                <th>Domain Email</th>
                <th>Auth Email</th>
                <th>Trial</th>
                <th>Password</th>
                <th>Type</th>
                <th>TT</th>
                <th className='w-[7%] sticky bg-black right-0'><IoOptionsOutline className='inline' /></th>
              </tr>
            </thead>
            <tbody className="text-[0.5rem]" onClick={handleExtendRow}>
              {
                accounts.length && accounts.map(
                  (a, idx) => (
                    <>
                      <tr
                      className={`
                          text-[0.8rem] text-center hover:border-cyan-600 hover:border
                          ${a.emailCreditsUsed !== a.emailCreditsLimit  ? 'el-ok' : 'el-no'}
                          ${ stateHelper.getEntityTasks(a._id).length ? 'fieldBlink' : '' }
                          ${ stateResStatusHelper.getByID(a._id, 0)[1] === 'ok' ? 'resOK' : '' }
                          ${ stateResStatusHelper.getByID(a._id, 0)[1] === 'fail' ? 'resFail' : '' }
                        `}
                        data-idx={idx} key={idx}
                      >
                      <td className='overflow-scroll truncate' data-type='extend' >{a.domainEmail}</td>
                      <td className='overflow-scroll truncate' data-type='extend' >{a.email}</td>
                        <td className='overflow-scroll truncate' data-type='extend' >{fmtDate(a.trialTime)}</td>
                        <td className='overflow-scroll truncate' data-type='extend' >{a.password}</td>
                        <td className='overflow-scroll truncate' data-type='extend' >{a.accountType}</td>
                        <td className='overflow-scroll truncate' data-type='extend' >{fmtDate(a.trialTime)}</td>
                        <td className='overflow-scroll sticky bg-black right-0' data-type='opt'>
                          <button >
                            <SlOptionsVertical className='inline'/>
                          </button>
                        </td>
                      </tr>
                      <tr className="hidden">
                      <table className="hidden border-cyan-600 border-y text-[0.7rem]">
                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2">Trial:</th>
                          <td className="px-2">{fmtDate(a.trialTime)}</td>
                        </tr>
                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2">Email:</th>
                          <td className="px-2">{a.email}</td>
                        </tr>
                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2">Password:</th>
                          <td className="px-2">{a.password}</td>
                        </tr>
                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2">Account Type:</th>
                          <td className="px-2">{a.accountType}</td>
                        </tr>
                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2">Domain Email:</th>
                          <td className="px-2">{a.domain}</td>
                        </tr>

                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2">Is Account Suspended:</th>
                          <td className="px-2">{a.suspended}</td>
                        </tr>
                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2">Cookies:</th>
                          <td className="px-2">{!!a.cookie}</td>
                        </tr>
                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2">Proxy:</th>
                          <td className="px-2">{a.proxy}</td>
                        </tr>
                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2">Last Used:</th>
                          <td className="px-2">{fmtDate(a.lastUsed)}</td>
                        </tr>
                      </table>
                    </tr>
                  </>
                )
              )
            }
          </tbody>
        </table>
        </div>
      </div>
    </div>
  </>
  )
})

type EmailProps = {
  input: Observable<Partial<IAccount>>
  addAccount: (e: FormEvent<HTMLFormElement>) => Promise<void>
  stateHelper: ReturnType<typeof TaskHelpers<AccountReqType>>
  stateResStatusHelper: ReturnType<typeof ResStatusHelpers<AccountReqType>>
}

export const EmailForm = (props: EmailProps) => {

  return(
    <form onSubmit={props.addAccount}>
      <div className='flex basis-1/2 gap-5'>
        <div>
          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2' htmlFor="email">Email:</label>
            <input className={`
                ${ props.stateHelper.getTaskByReqType('new')[0] ? 'fieldBlink' : '' }
                ${ props.stateResStatusHelper.getByID('new', 0)[1] === 'ok' ? 'resOK' : '' }
                ${ props.stateResStatusHelper.getByID('new', 0)[1] === 'fail' ? 'resFail' : '' }
              `}
              required type="text" id="email" value={props.input.email.get()} onChange={ e => {props.input.set(p => ({...p, email: e.target.value}))}}/>
          </div>

          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2' htmlFor="password">Password:</label>
            <input className={`
                ${ props.stateHelper.getTaskByReqType('new')[0] ? 'fieldBlink' : '' }
                ${ props.stateResStatusHelper.getByID('new', 0)[1] === 'ok' ? 'resOK' : '' }
                ${ props.stateResStatusHelper.getByID('new', 0)[1] === 'fail' ? 'resFail' : '' }
              `}
              required type="text" id="password" value={props.input.password.get()} onChange={ e => {props.input.set(p => ({...p, password: e.target.value}))}}/>
          </div>
        </div>

        <div>
          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2 mb-1' htmlFor="domain">Alias Email:</label>
            <input className={`
                ${ props.stateHelper.getTaskByReqType('new')[0] ? 'fieldBlink' : '' }
                ${ props.stateResStatusHelper.getByID('new', 0)[1] === 'ok' ? 'resOK' : '' }
                ${ props.stateResStatusHelper.getByID('new', 0)[1] === 'fail' ? 'resFail' : '' }
              `}
              type="text" id="domain" value={props.input.domainEmail.get()} onChange={ e => {props.input.set(p => ({...p, domainEmail: e.target.value}))}}/>
          </div>

          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2 mb-1' htmlFor="recovery">Recovery Email:</label>
            <input className={`
                ${ props.stateHelper.getTaskByReqType('new')[0] ? 'fieldBlink' : '' }
                ${ props.stateResStatusHelper.getByID('new', 0)[1] === 'ok' ? 'resOK' : '' }
                ${ props.stateResStatusHelper.getByID('new', 0)[1] === 'fail' ? 'resFail' : '' }
              `}
              type="text" id="recovery" value={props.input.recoveryEmail.get()} onChange={ e => {props.input.set(p => ({...p, recoveryEmail: e.target.value}))}}/>
          </div>
        </div>
      </div>
      <input className='text-cyan-600 border-cyan-600 border rounded p-1' type="submit" value="Add Account"/>
    </form>
  )
}

type DomainProps = {
  domains: IDomain[]
  addAccount: (e: FormEvent<HTMLFormElement>) => Promise<void>
  selectedDomain: ObservableObject<string>
  stateHelper: ReturnType<typeof TaskHelpers<AccountReqType>>
  stateResStatusHelper: ReturnType<typeof ResStatusHelpers<AccountReqType>>
}

export const DomainForm = (props: DomainProps) => {
  const [selected, setSelected] = useState('')


  return (
    <form onSubmit={props.addAccount}>
      <div className='flex basis-1/2 gap-5 mt-1 mb-3'>
      <label htmlFor="domain">Select a domain:</label>

      <select
        id="domain"
        onChange={e => setSelected(e.target.value)}
        className={`
          ${ props.stateHelper.getTaskByReqType('new').length ? 'fieldBlink' : '' }
          ${ props.stateResStatusHelper.getByID('new', 0)[1] === 'ok' ? 'resOK' : '' }
          ${ props.stateResStatusHelper.getByID('new', 0)[1] === 'fail' ? 'resFail' : '' }
        `}
        value={selected}
      >
        {
          props.domains.map((d) => <option value={d.domain}>{d.domain}</option>)
        }
      </select>
      </div>
      <input className='text-cyan-600 border-cyan-600 border rounded p-1' type="submit" value="Add Account"/>
    </form>
  )
}