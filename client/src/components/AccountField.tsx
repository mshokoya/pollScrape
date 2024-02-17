import { Dispatch, FormEvent, MouseEvent, SetStateAction, useEffect, useState } from "react"
import {ResStatus, fetchData} from '../core/util';
import { SlOptionsVertical } from "react-icons/sl";
import { IoOptionsOutline } from "react-icons/io5";
import { AccountPopup } from "./AccountPopup";
import { IDomain } from "./DomainField";

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



// https://jsfiddle.net/mfwYS/
// https://medium.com/@stephenbunch/how-to-make-a-scrollable-container-with-dynamic-height-using-flexbox-5914a26ae336

export const AccountField = () => {
  const [input, setInput] = useState<Partial<IAccount>>({email: '', password: '', recoveryEmail: '', domainEmail: ''});
  const [selectedAcc, setSelectedAcc] = useState<number | null>(null)
  const [reqInProcess, setReqInProcess] = useState<string[]>([])
  const [reqType, setReqType] = useState<string | null>(null)
  const [resStatus, setResStatus] = useState<ResStatus>(null)
  const [accounts, setAccounts] = useState<IAccount[]>([])
  const [addType, setAddType] = useState<'domain' | 'email'>('email')
  const [selectedDomain, setSelectedDomain] = useState<string>('')
  const [domains, setDomains] = useState<IDomain[]>([])

  useEffect(() => {
    fetchData<IAccount[]>('/account', 'GET')
      .then(data => setAccounts(data.data))
      .catch(() => {})
    getDomainList()
  }, [])

  const handleExtendRow = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    //@ts-ignore
    const type = e.target.closest('td')?.dataset.type as string

    switch (type) {
      case 'opt':
        //@ts-ignore
        const accIdx = e.target.closest('tr').dataset.idx;
        setSelectedAcc(accIdx)
        break;
      case 'extend':
        //@ts-ignore
        e.target.closest('tr').nextSibling.classList.toggle('hidden')
        //@ts-ignore
        e.target.closest('tr').nextSibling.firstElementChild?.classList.toggle('hidden')
        break;
    }
  }

  const getDomainList = async () => {
    await fetchData<IDomain[]>('/domain', 'GET')
    .then(data => {
      setDomains(data.data)
    })
    .catch(() => {})
  }

  // (FIX) email verification + get domain to determine login type
  const addAccount = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setReqInProcess([...reqInProcess, 'new'])
    setReqType('create')
    await fetchData<IAccount>('/account', 'POST', {...input, addType, selectedDomain})
      .then((d) => {
        if (d.ok) {
          setResStatus(['ok', 'new'])
          setAccounts([...accounts, d.data])
        } else {
          setResStatus(['fail', 'new'])
        }
      })
      .catch(() => { setResStatus(['fail', 'new']) })
      .finally(() => {
        setTimeout(() => {
          setReqInProcess(reqInProcess.filter(d => d !== 'new'))
          setReqType(null)
          setResStatus(null)
        }, 1500)
      })
  }

  const login = async () => {
    if (!selectedAcc) return;
    const accountID = accounts[selectedAcc]._id
    setReqInProcess([...reqInProcess, accountID])
    setReqType('login')
    await fetchData<IAccount>(`/account/login/a/${accountID}`, 'GET')
      .then(data => {
        data.ok
          ? setResStatus(['ok', accountID])
          : setResStatus(['fail', accountID])
      })
      .catch(() => { setResStatus(['fail', accountID]) })
      .finally(() => {
        setTimeout(() => {
          setReqType(null)
          setReqInProcess(reqInProcess.filter(d => d !== accountID))
          setResStatus(null)
        }, 1500)
      })
  }

  const manualLogin = async () => {
    if (!selectedAcc) return;
    const accountID = accounts[selectedAcc]._id
    setReqInProcess([...reqInProcess, accountID])
    setReqType('manualLogin')
    await fetchData<IAccount>(`/account/login/m/${accountID}`, 'GET')
      .then(data => {
        data.ok
          ? setResStatus(['ok', accountID])
          : setResStatus(['fail', accountID])
      })
      .catch(() => { setResStatus(['fail', accountID]) })
      .finally(() => {
        setTimeout(() => {
          setReqType(null)
          setReqInProcess(reqInProcess.filter(d => d !== accountID))
          setResStatus(null)
        }, 1500)
      })
  }

  const checkAccount = async () => {
    if (!selectedAcc) return;
    const accountID = accounts[selectedAcc]._id
    setReqInProcess([...reqInProcess, accountID])
    setReqType('check')
    await fetchData<IAccount>(`/account/check/${accountID}`, 'GET')
      .then(data => {
        if (data.ok) {
          setResStatus(['ok', accountID])
          const updateAccs = accounts.map(acc => acc._id === data.data._id ? data.data : acc );
          setAccounts(updateAccs)
        } else {
          setResStatus(['fail', accountID])
        }
      })
      .catch(() => { setResStatus(['fail', accountID]) })
      .finally(() => {
        setTimeout(() => {
          setReqType(null)
          setReqInProcess(reqInProcess.filter(d => d !== accountID))
          setResStatus(null)
        }, 1500)
      })
  }

  const updateAccount = async (acc: Partial<IAccount>) => {
    if (!selectedAcc) return;
    const accountID = accounts[selectedAcc]._id
    setReqInProcess([...reqInProcess, accountID])
    setReqType('update')
    await fetchData<IAccount>(`/account/${accountID}`, 'PUT', acc)
      .then(data => {
        if (data.ok) {
          setResStatus(['ok', accountID])
          const updateAccs = accounts.map(acc => acc._id === data.data._id ? data.data : acc );
          setAccounts(updateAccs)
        } else {
          setResStatus(['fail', accountID])
        }
      })
      .catch(() => { setResStatus(['fail', accountID]) })
      .finally(() => {
        setTimeout(() => {
          setReqType(null)
          setReqInProcess(reqInProcess.filter(d => d !== accountID))
          setResStatus(null)
        }, 1500)
      })
  }

  const upgradeAccount = async () => {
    if (!selectedAcc) return;
    const accountID = accounts[selectedAcc]._id
    setReqInProcess([...reqInProcess, accountID])
    setReqType('upgrade')
    await  fetchData<IAccount>(`/account/upgrade/a/${accountID}`, 'GET')
      .then( data => {
        if (data.ok) {
          setResStatus(['ok', accountID])
          const updateAccs = accounts.map(acc => acc._id === data.data._id ? data.data : acc );
          setAccounts(updateAccs)
        } else {
          setResStatus(['fail', accountID])
        }
      })
      .catch(() => { setResStatus(['fail', accountID]) })
      .finally(() => {
        setTimeout(() => {
          setReqType(null)
          setReqInProcess(reqInProcess.filter(d => d !== accountID))
          setResStatus(null)
        }, 1500)
      })
  }

  const manualUpgradeAccount = async () => {
    if (!selectedAcc) return;
    const accountID = accounts[selectedAcc]._id
    setReqInProcess([...reqInProcess, accountID])
    setReqType('manualUpgrade')
    await fetchData<IAccount>(`/account/upgrade/m/${accountID}`, 'GET')
      .then(data => {
        if (data.ok) {
          setResStatus(['ok', accountID])
          const updateAccs = accounts.map(acc => acc._id === data.data._id ? data.data : acc );
          setAccounts(updateAccs)
        } else {
          setResStatus(['fail', accountID])
        }
      })
      .catch(() => { setResStatus(['fail', accountID]) })
      .finally(() => {
        setTimeout(() => {
          setReqType(null)
          setReqInProcess(reqInProcess.filter(d => d !== accountID))
          setResStatus(null)
        }, 1500)
      })
  }

  const clearMines = async () => {
    if (!selectedAcc) return;
    const accountID = accounts[selectedAcc]._id
    setReqInProcess([...reqInProcess, accountID])
    setReqType('mines')
    await fetchData<IAccount>(`/account/demine/${accountID}`, 'GET')
      .then(data => {
        if (data.ok) {
          setResStatus(['ok', accountID])
          const updateAccs = accounts.map(acc => acc._id === data.data._id ? data.data : acc );
          setAccounts(updateAccs)
        } else {
          setResStatus(['fail', accountID])
        }
      })
      .catch(() => { setResStatus(['fail', accountID]) })
      .finally(() => {
        setTimeout(() => {
          setReqType(null)
          setReqInProcess(reqInProcess.filter(d => d !== accountID))
          setResStatus(null)
        }, 1500)
      })
  }
  
  const confirmAccount = async () => {
    if (!selectedAcc) return;
    const accountID = accounts[selectedAcc]._id
    setReqInProcess([...reqInProcess, accountID])
    setReqType('confirm')
    await fetchData<IAccount>(`/account/confirm/${accountID}`, 'GET')
      .then(data => {
        console.log('pass')
        console.log(data)
        if (data.ok) {
          setResStatus(['ok', accountID])
          const updateAccs = accounts.map(acc => acc._id === data.data._id ? data.data : acc );
          setAccounts(updateAccs)
        } else {
          setResStatus(['fail', accountID])
        }
      })
      .catch((el) => { 
        console.log('fail')
        console.log(el)
        setResStatus(['fail', accountID]) 
      
      })
      .finally(() => {
        setTimeout(() => {
          setReqType(null)
          setReqInProcess(reqInProcess.filter(d => d !== accountID))
          setResStatus(null)
        }, 1500)
      })
  }

  const deleteAccount = async () => {
    if (!selectedAcc) return;
    const accountID = accounts[selectedAcc]._id
    setReqInProcess([...reqInProcess, accountID])
    setReqType('mines')
    await fetchData<IAccount>(`/account/${accountID}`, 'DELETE')
      .then(data => {
        data.ok
          ? setResStatus(['ok', accountID])
          : setResStatus(['fail', accountID])
      })
      .catch(() => { setResStatus(['fail', accountID]) })
      .finally(() => {
        setTimeout(() => {
          setReqType(null)
          setReqInProcess(reqInProcess.filter(d => d !== accountID))
          setResStatus(null)
        }, 1500)
      })
  }

  const fmtDate = (n: any) => n.toDateString
      ? n.toDateString()
      : n;


  const PopupComp = () => selectedAcc
      ? <AccountPopup
          req={reqType}
          manualLogin={manualLogin}
          updateAccount={updateAccount}
          setPopup={setSelectedAcc}
          checkAccount={checkAccount}
          reqInProcess={reqInProcess} 
          setReqInProcess={setReqInProcess}
          login={login}
          deleteAccount={deleteAccount}
          clearMines={clearMines}
          upgradeAccount={upgradeAccount}
          manualUpgradeAccount={manualUpgradeAccount}
          account={accounts[selectedAcc]}
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
            onClick={() => setAddType('email')}
          > 
            email
          </button>

          <button 
            className='text-cyan-600 border-cyan-600 border rounded p-1'
            onClick={() => setAddType('domain')}
          > 
            domain
          </button>
        </div>
        

        <div className='mb-2'>
          {
            addType === 'email'
              ? <EmailForm 
                  input={input}
                  setInput={setInput}
                  resStatus={resStatus}
                  reqInProcess={reqInProcess}
                  addAccount={addAccount}
                />
              : <DomainForm 
                  domains={domains}
                  setSelectedDomain={setSelectedDomain}
                  resStatus={resStatus}
                  reqInProcess={reqInProcess}
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
                      <tr className={`
                        text-[0.8rem] text-center hover:border-cyan-600 hover:border
                          ${a.emailCreditsUsed !== a.emailCreditsLimit  ? 'el-ok' : 'el-no'} 
                          ${ reqInProcess.includes(a._id) ? 'fieldBlink' : '' } 
                          ${ resStatus && resStatus[0] === 'ok' && resStatus[1]!.includes(a._id) ? 'resOK' : '' } 
                          ${ resStatus && resStatus[0] === 'fail' && resStatus[1]!.includes(a._id) ? 'resFail' : '' } 
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
}

type EmailProps = {
  input: Partial<IAccount>
  setInput: Dispatch<SetStateAction<Partial<IAccount>>>
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
                ${ props.resStatus && props.resStatus[0] === 'ok' && props.resStatus[1]!.includes('new') ? 'resOK' : '' } 
                ${ props.resStatus && props.resStatus[0] === 'fail' && props.resStatus[1]!.includes('new') ? 'resFail' : '' }
              `}
              required type="text" id="email" value={props.input.email} onChange={ e => {props.setInput(p => ({...p, email: e.target.value}))}}/>
          </div>

          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2' htmlFor="password">Password:</label>
            <input className={`
                ${ props.reqInProcess.includes('new') ? 'fieldBlink' : '' } 
                ${ props.resStatus && props.resStatus[0] === 'ok' && props.resStatus[1]!.includes('new') ? 'resOK' : '' } 
                ${ props.resStatus && props.resStatus[0] === 'fail' && props.resStatus[1]!.includes('new') ? 'resFail' : '' }
              `}
              required type="text" id="password" value={props.input.password} onChange={ e => {props.setInput(p => ({...p, password: e.target.value}))}}/>
          </div>
        </div>
      
        <div>
          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2 mb-1' htmlFor="domain">Alias Email:</label>
            <input className={`
                ${ props.reqInProcess.includes('new') ? 'fieldBlink' : '' } 
                ${ props.resStatus && props.resStatus[0] === 'ok' && props.resStatus[1]!.includes('new') ? 'resOK' : '' } 
                ${ props.resStatus && props.resStatus[0] === 'fail' && props.resStatus[1]!.includes('new') ? 'resFail' : '' }
              `}
              type="text" id="domain" value={props.input.domainEmail} onChange={ e => {props.setInput(p => ({...p, domainEmail: e.target.value}))}}/>
          </div>

          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2 mb-1' htmlFor="recovery">Recovery Email:</label>
            <input className={`
                ${ props.reqInProcess.includes('new') ? 'fieldBlink' : '' } 
                ${ props.resStatus && props.resStatus[0] === 'ok' && props.resStatus[1]!.includes('new') ? 'resOK' : '' } 
                ${ props.resStatus && props.resStatus[0] === 'fail' && props.resStatus[1]!.includes('new') ? 'resFail' : '' }
              `}
              type="text" id="recovery" value={props.input.recoveryEmail} onChange={ e => {props.setInput(p => ({...p, recoveryEmail: e.target.value}))}}/>
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
  setSelectedDomain: Dispatch<SetStateAction<string>>
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
          ${ props.resStatus && props.resStatus[0] === 'ok' && props.resStatus[1]!.includes('new') ? 'resOK' : '' } 
          ${ props.resStatus && props.resStatus[0] === 'fail' && props.resStatus[1]!.includes('new') ? 'resFail' : '' }
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