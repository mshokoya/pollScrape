import { FormEvent, MouseEvent, useEffect, useState } from "react"
import {ResStatus, TaskInProcess, TaskStatus, appState$, fetchData, getCompletedTaskKey} from '../core/util';
import { SlOptionsVertical } from "react-icons/sl";
import { IoOptionsOutline } from "react-icons/io5";
import { AccountPopup } from "./AccountPopup";
import { IDomain } from "./DomainField";
import { observer, useObservable, useSelector } from "@legendapp/state/react";
import { Observable, batch } from "@legendapp/state";
import { IOResponse, io } from "../core/io";

export type IAccount = {
  _id: string
  domain: string
  accountType: string
  trialTime: string
  suspended: boolean
  verified: boolean
  loginType: 'default' | 'gmail' | 'outlook'
  email: string
  password: string
  cookie: string
  firstname: string
  lastname: string
  proxy: string
  domainEmail: string
  lastUsed: Date
  recoveryEmail: string
  emailCreditsUsed: number
  emailCreditsLimit: number
  renewalDateTime: number | Date
  renewalStartDate: number | Date
  renewalEndDate: number | Date
  trialDaysLeft: number
  apolloPassword: string
}

export type ReqType = 'confirm' | 'check' | 'login' | 'update' | 'manualLogin'  | 'manualUpgrade' | 'mines' | 'upgrade' | 'delete'

export type State = {
  input: Partial<IAccount>
    selectedAcc: number | null
    reqInProcess: TaskInProcess<ReqType>
    reqType: string | null
    resStatus: {[id: string]: boolean},
    addType: 'domain' | 'email'
    selectedDomain: string | null
}

// https://jsfiddle.net/mfwYS/
// https://medium.com/@stephenbunch/how-to-make-a-scrollable-container-with-dynamic-height-using-flexbox-5914a26ae336

export const AccountField = observer(() => {
  const accounts = useSelector(appState$.accounts) as IAccount[]
  const domains = useSelector(appState$.domains) as IDomain[]
  const s = useObservable<State>({
    input: {email: '', password: '', recoveryEmail: '', domainEmail: ''},
    selectedAcc: null,
    reqInProcess: {},  // reqInProcess: [],
    reqType: null,
    resStatus: {},
    addType: 'email',
    selectedDomain: null,
  })

  io.on('apollo', function (msg: IOResponse) {
    const [accountID, idx] = getCompletedTaskKey(s.reqInProcess.peek(), msg.taskID)
    if (!accountID || !idx) return;

    if (msg.ok !== null && msg.ok !== undefined) {
      switch (msg.ok) {
        case false:
          s.resStatus[accountID].set(false)
          break
        case true:
          s.resStatus[accountID].set(true)
          break
      }
      setTimeout(() => {
        batch(() => {      
          if (accountID) s.reqInProcess[accountID][idx].delete()
          s.resStatus[accountID].delete()
        })
      }, 1500)

    } else if (msg.data.accountID) {
      // s.reqInProcess[accountID].push()
      s.reqInProcess[accountID].peek()
        ? s.reqInProcess[accountID].push()
        : s.reqInProcess[accountID].set([
          {
            taskID: msg.taskID, 
            type: msg.type! as ReqType, 
            status: msg.status as TaskStatus
          }
        ])
    }
  })
  

  useEffect(() => {
    fetchData<IAccount[]>('/account', 'GET')
      .then(data => appState$.accounts.set(data.data))
      .catch(() => {})
  }, [])

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
    const reqInProcess = s.reqInProcess.get()
    s.reqInProcess.set([...reqInProcess, 'new'])
    s.reqType.set('create')
    await fetchData<IAccount>('/account', 'POST', {...s.input.get(), addType: s.addType.get(), selectedDomain: s.selectedDomain.get()})
      .then((d) => {
        if (d.ok) {
          s.resStatus.set(['ok', 'new'])
          appState$.accounts.set((acc) => [...acc, d.data])
        } else {
          s.resStatus.set(['fail', 'new'])
        }
      })
      .catch(() => { s.resStatus.set(['fail', 'new']) })
      .finally(() => {
        setTimeout(() => {
          s.reqInProcess.set(reqInProcess.filter(d => d !== 'new'))
          s.reqType.set(null)
          s.resStatus.set(null)
        }, 1500)
      })
  }

  const login = async () => {
    const selectedAcc = s.selectedAcc.get()
    const reqInProcess = s.reqInProcess.get()
    if (!selectedAcc) return;

    const accountID = accounts[selectedAcc]._id
    s.reqInProcess.set([...reqInProcess, accountID])
    s.reqType.set('login')
    await fetchData<IAccount>(`/account/login/a/${accountID}`, 'GET')
      .then(data => {
        data.ok
          ? s.resStatus.set(['ok', accountID])
          : s.resStatus.set(['fail', accountID])
      })
      .catch(() => { s.resStatus.set(['fail', accountID]) })
      .finally(() => {
        setTimeout(() => {
          s.reqType.set(null)
          s.reqInProcess.set(reqInProcess.filter(d => d !== accountID))
          s.resStatus.set(null)
        }, 1500)
      })
  }

  const manualLogin = async () => {
    const selectedAcc = s.selectedAcc.get()
    const reqInProcess = s.reqInProcess.get()
    if (!selectedAcc) return;

    const accountID = accounts[selectedAcc]._id
    s.reqInProcess.set([...reqInProcess, accountID])
    s.reqType.set('manualLogin')
    await fetchData<IAccount>(`/account/login/m/${accountID}`, 'GET')
      .then(data => {
        data.ok
          ? s.resStatus.set(['ok', accountID])
          : s.resStatus.set(['fail', accountID])
      })
      .catch(() => { s.resStatus.set(['fail', accountID]) })
      .finally(() => {
        setTimeout(() => {
          s.reqType.set(null)
          s.reqInProcess.set(reqInProcess.filter(d => d !== accountID))
          s.resStatus.set(null)
        }, 1500)
      })
  }

  const checkAccount = async () => {
    const selectedAcc = s.selectedAcc.get()
    const reqInProcess = s.reqInProcess.get()
    if (!selectedAcc) return;

    const accountID = accounts[selectedAcc]._id
    s.reqInProcess.set([...reqInProcess, accountID])
    s.reqType.set('check')
    await fetchData<IAccount>(`/account/check/${accountID}`, 'GET')
      .then(data => {
        if (data.ok) {
          s.resStatus.set(['ok', accountID])
          const updateAccs = accounts.map(acc => acc._id === data.data._id ? data.data : acc );
          appState$.accounts.set(updateAccs)
        } else {
          s.resStatus.set(['fail', accountID])
        }
      })
      .catch(() => { s.resStatus.set(['fail', accountID]) })
      .finally(() => {
        setTimeout(() => {
          s.reqType.set(null)
          s.reqInProcess.set(reqInProcess.filter(d => d !== accountID))
          s.resStatus.set(null)
        }, 1500)
      })
  }

  const updateAccount = async (acc: Partial<IAccount>) => {
    const selectedAcc = s.selectedAcc.get()
    const reqInProcess = s.reqInProcess.get()
    if (!selectedAcc) return;

    const accountID = accounts[selectedAcc]._id
    s.reqInProcess.set([...reqInProcess, accountID])
    s.reqType.set('update')
    await fetchData<IAccount>(`/account/${accountID}`, 'PUT', acc)
      .then(data => {
        if (data.ok) {
          s.resStatus.set(['ok', accountID])
          const updateAccs = accounts.map(acc => acc._id === data.data._id ? data.data : acc );
          appState$.accounts.set(updateAccs)
        } else {
          s.resStatus.set(['fail', accountID])
        }
      })
      .catch(() => { s.resStatus.set(['fail', accountID]) })
      .finally(() => {
        setTimeout(() => {
          s.reqType.set(null)
          s.reqInProcess.set(reqInProcess.filter(d => d !== accountID))
          s.resStatus.set(null)
        }, 1500)
      })
  }

  const upgradeAccount = async () => {
    const selectedAcc = s.selectedAcc.get()
    const reqInProcess = s.reqInProcess.get()
    if (!selectedAcc) return;

    const accountID = accounts[selectedAcc]._id
    s.reqInProcess.set([...reqInProcess, accountID])
    s.reqType.set('upgrade')
    await  fetchData<IAccount>(`/account/upgrade/a/${accountID}`, 'GET')
      .then( data => {
        if (data.ok) {
          s.resStatus.set(['ok', accountID])
          const updateAccs = accounts.map(acc => acc._id === data.data._id ? data.data : acc );
          appState$.accounts.set(updateAccs)
        } else {
          s.resStatus.set(['fail', accountID])
        }
      })
      .catch(() => { s.resStatus.set(['fail', accountID]) })
      .finally(() => {
        setTimeout(() => {
          s.reqType.set(null)
          s.reqInProcess.set(reqInProcess.filter(d => d !== accountID))
          s.resStatus.set(null)
        }, 1500)
      })
  }

  const manualUpgradeAccount = async () => {
    const selectedAcc = s.selectedAcc.get()
    const reqInProcess = s.reqInProcess.get()
    if (!selectedAcc) return;

    const accountID = accounts[selectedAcc]._id
    s.reqInProcess.set([...reqInProcess, accountID])
    s.reqType.set('manualUpgrade')
    await fetchData<IAccount>(`/account/upgrade/m/${accountID}`, 'GET')
      .then(data => {
        if (data.ok) {
          s.resStatus.set(['ok', accountID])
          const updateAccs = accounts.map(acc => acc._id === data.data._id ? data.data : acc );
          appState$.accounts.set(updateAccs)
        } else {
          s.resStatus.set(['fail', accountID])
        }
      })
      .catch(() => { s.resStatus.set(['fail', accountID]) })
      .finally(() => {
        setTimeout(() => {
          s.reqType.set(null)
          s.reqInProcess.set(reqInProcess.filter(d => d !== accountID))
          s.resStatus.set(null)
        }, 1500)
      })
  }

  const clearMines = async () => {
    const selectedAcc = s.selectedAcc.get()
    const reqInProcess = s.reqInProcess.get()
    if (!selectedAcc) return;

    const accountID = accounts[selectedAcc]._id
    s.reqInProcess.set([...reqInProcess, accountID])
    s.reqType.set('mines')
    await fetchData<IAccount>(`/account/demine/${accountID}`, 'GET')
      .then(data => {
        if (data.ok) {
          s.resStatus.set(['ok', accountID])
          const updateAccs = accounts.map(acc => acc._id === data.data._id ? data.data : acc );
          appState$.accounts.set(updateAccs)
        } else {
          s.resStatus.set(['fail', accountID])
        }
      })
      .catch(() => { s.resStatus.set(['fail', accountID]) })
      .finally(() => {
        setTimeout(() => {
          s.reqType.set(null)
          s.reqInProcess.set(reqInProcess.filter(d => d !== accountID))
          s.resStatus.set(null)
        }, 1500)
      })
  }
  
  const confirmAccount = async () => {
    const selectedAcc = s.selectedAcc.get()
    const reqInProcess = s.reqInProcess.get()
    if (!selectedAcc) return;

    const accountID = accounts[selectedAcc]._id
    s.reqInProcess.set([...reqInProcess, accountID])
    s.reqType.set('confirm')
    await fetchData<IAccount>(`/account/confirm/${accountID}`, 'GET')
      .then(data => {
        console.log('pass')
        console.log(data)
        if (data.ok) {
          s.resStatus.set(['ok', accountID])
          const updateAccs = accounts.map(acc => acc._id === data.data._id ? data.data : acc );
          appState$.accounts.set(updateAccs)
        } else {
          s.resStatus.set(['fail', accountID])
        }
      })
      .catch((el) => { 
        console.log('fail')
        console.log(el)
        s.resStatus.set(['fail', accountID]) 
      
      })
      .finally(() => {
        setTimeout(() => {
          s.reqType.set(null)
          s.reqInProcess.set(reqInProcess.filter(d => d !== accountID))
          s.resStatus.set(null)
        }, 1500)
      })
  }

  // (FIX) complete func
  const deleteAccount = async () => {
    const selectedAcc = s.selectedAcc.get()
    const reqInProcess = s.reqInProcess.get()
    if (!selectedAcc) return;

    const accountID = accounts[selectedAcc]._id
    s.reqInProcess.set([...reqInProcess, accountID])
    s.reqType.set('delete')
    await fetchData<IAccount>(`/account/${accountID}`, 'DELETE')
      .then(data => {
        data.ok
          ? s.resStatus.set(['ok', accountID])
          : s.resStatus.set(['fail', accountID])
      })
      .catch(() => { s.resStatus.set(['fail', accountID]) })
      .finally(() => {
        setTimeout(() => {
          s.reqType.set(null)
          s.reqInProcess.set(reqInProcess.filter(d => d !== accountID))
          s.resStatus.set(null)
        }, 1500)
      })
  }

  const fmtDate = (n: any) => n.toDateString
      ? n.toDateString()
      : n;


  const setPopup = (v: any) => {s.selectedAcc.set(v)}

  const PopupComp = () => s.selectedAcc.get()
      ? <AccountPopup
          req={s.reqType.peek()}
          manualLogin={manualLogin}
          updateAccount={updateAccount}
          setPopup={setPopup}
          checkAccount={checkAccount}
          reqInProcess={s.reqInProcess} 
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
                  resStatus={s.resStatus.get()}
                  reqInProcess={s.reqInProcess.get()}
                  addAccount={addAccount}
                />
              : <DomainForm 
                  domains={domains}
                  selectedDomain={s.selectedDomain}
                  resStatus={s.resStatus.get()}
                  reqInProcess={s.reqInProcess.get()}
                  addAccount={addAccount}

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
                          ${ s.reqInProcess.includes(a._id) ? 'fieldBlink' : '' } 
                          ${ s.resStatus.get() && s.resStatus[0].get() === 'ok' && s.resStatus[1].get().includes(a._id) ? 'resOK' : '' } 
                          ${ s.resStatus.get() && s.resStatus[0].get() === 'fail' && s.resStatus[1].get().includes(a._id) ? 'resFail' : '' } 
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
  resStatus: ResStatus
  reqInProcess: string[]
  addAccount: (e: FormEvent<HTMLFormElement>) => Promise<void>
}

export const EmailForm = (props: EmailProps) => {

  return(
    <form onSubmit={props.addAccount}>
      <div className='flex basis-1/2 gap-5'>
        <div>
          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2' htmlFor="email">Email:</label>
            <input className={`
                ${ props.reqInProcess.includes('new') ? 'fieldBlink' : '' } 
                ${ props.resStatus && props.resStatus[0] === 'ok' && props.resStatus[1].includes('new') ? 'resOK' : '' } 
                ${ props.resStatus && props.resStatus[0] === 'fail' && props.resStatus[1].includes('new') ? 'resFail' : '' }
              `}
              required type="text" id="email" value={props.input.email.get()} onChange={ e => {props.input.set(p => ({...p, email: e.target.value}))}}/>
          </div>

          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2' htmlFor="password">Password:</label>
            <input className={`
                ${ props.reqInProcess.includes('new') ? 'fieldBlink' : '' } 
                ${ props.resStatus && props.resStatus[0] === 'ok' && props.resStatus[1].includes('new') ? 'resOK' : '' } 
                ${ props.resStatus && props.resStatus[0] === 'fail' && props.resStatus[1].includes('new') ? 'resFail' : '' }
              `}
              required type="text" id="password" value={props.input.password.get()} onChange={ e => {props.input.set(p => ({...p, password: e.target.value}))}}/>
          </div>
        </div>
      
        <div>
          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2 mb-1' htmlFor="domain">Alias Email:</label>
            <input className={`
                ${ props.reqInProcess.includes('new') ? 'fieldBlink' : '' } 
                ${ props.resStatus && props.resStatus[0] === 'ok' && props.resStatus[1].includes('new') ? 'resOK' : '' } 
                ${ props.resStatus && props.resStatus[0] === 'fail' && props.resStatus[1].includes('new') ? 'resFail' : '' }
              `}
              type="text" id="domain" value={props.input.domainEmail.get()} onChange={ e => {props.input.set(p => ({...p, domainEmail: e.target.value}))}}/>
          </div>

          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2 mb-1' htmlFor="recovery">Recovery Email:</label>
            <input className={`
                ${ props.reqInProcess.includes('new') ? 'fieldBlink' : '' } 
                ${ props.resStatus && props.resStatus[0] === 'ok' && props.resStatus[1].includes('new') ? 'resOK' : '' } 
                ${ props.resStatus && props.resStatus[0] === 'fail' && props.resStatus[1].includes('new') ? 'resFail' : '' }
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
  resStatus: ResStatus
  reqInProcess: string[]
  addAccount: (e: FormEvent<HTMLFormElement>) => Promise<void>
  selectedDomain: Observable<string | null>
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
          ${ props.reqInProcess.includes('new') ? 'fieldBlink' : '' } 
          ${ props.resStatus && props.resStatus[0] === 'ok' && props.resStatus[1].includes('new') ? 'resOK' : '' } 
          ${ props.resStatus && props.resStatus[0] === 'fail' && props.resStatus[1].includes('new') ? 'resFail' : '' }
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