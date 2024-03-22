import { FormEvent, MouseEvent } from "react"
import { ResStatusHelpers, TaskHelpers, fetchData} from '../core/util';
import { SlOptionsVertical } from "react-icons/sl";
import { IoOptionsOutline } from "react-icons/io5";
import { AccountPopup } from "./AccountPopup";
import { IDomain } from "./DomainField";
import { observer, useSelector } from "@legendapp/state/react";
import { Observable, ObservableObject, batch } from "@legendapp/state";
import { accountState, accountTaskHelper, stateResStatusHelper, IAccount, AccountReqType } from "../core/state/account";
import { appState$ } from "../core/state";


export const AccountField = observer(() => {
  const s = accountState //useSelector ?
  const accounts = useSelector(appState$.accounts) as IAccount[]
  const domains = useSelector(appState$.domains) as IDomain[]
  

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

  // (FIX) email verification + get domain to determine login type // also colors 
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

  const updateAccount = async (input: Partial<IAccount>) => {
    const accountID = accounts[s.selectedAcc.peek()]._id
    accountTaskHelper.add(accountID, {type: 'update', status: 'processing'})
    await fetchData<IAccount>(`/account/${accountID}`, 'PUT', input)
      .then((data) => {
        if (data.ok) {
          stateResStatusHelper.add(accountID, ['update', 'ok'])
          appState$.accounts.find(a => a._id.peek() === accountID)?.set(data.data)
        } else {
          stateResStatusHelper.add(accountID, ['update', 'fail'])
        }
      })
      .catch(() => { stateResStatusHelper.add(accountID, ['update', 'fail']) })
      .finally(() => {
        setTimeout(() => {
          batch(() => {
            accountTaskHelper.deleteTaskByReqType(accountID, 'update')
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
    if (!accountTaskHelper.isEntityPiplineEmpty(accountID)) return;

    accountTaskHelper.add(accountID, {status: 'processing', type: 'delete'})

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
            accountTaskHelper.deleteTaskByReqType(accountID, 'delete')
            stateResStatusHelper.delete(accountID, 'delete')
          })
        }, 1500)
      })
  }

  const fmtDate = (n: any) => n && n !== 'n/a'
      ? new Date(n).toDateString()
      : "N/A";

  const fmtCredits = (limit: number, used: number) => {
    return (limit === -1 || used === -1)
      ? "N/A"
      : `${used}/${limit} (${limit-used} left)`
    
  }

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
                  accountTaskHelper={accountTaskHelper}
                  stateResStatusHelper={stateResStatusHelper}
                />
              : <DomainForm
                  domains={domains}
                  addAccount={addAccount}
                  accountTaskHelper={accountTaskHelper}
                  stateResStatusHelper={stateResStatusHelper}
                  selectedDomain={s.selectedDomain}
                />
          }
        </div>

        <div className='border-cyan-600 border rounded grow overflow-auto'>
          <table className="text-[0.7rem] font-light m-auto table-fixed w-[200%]">
            <thead className='sticky top-0 bg-black'>
              <tr>
                <th className='px-2'> Domain Email </th>
                <th className='px-2'> Credits </th>
                <th className='px-2'> Verified </th>
                <th className='px-2'> Suspended </th>
                <th className='px-2'> Last Used </th>
                <th className='px-2'> Type </th>
                <th className='px-2'> Trial </th>
                <th className='w-7 sticky bg-black right-0'><IoOptionsOutline className='inline' /></th>
              </tr>
            </thead>
            <tbody className="text-[0.5rem] text-center" onClick={handleExtendRow}>
              {
                accounts.length && accounts.map(
                  (a, idx) => (
                    <>
                      <tr
                      className={`
                          text-[0.8rem] text-center hover:border-cyan-600 hover:border
                          ${a.emailCreditsUsed !== a.emailCreditsLimit  ? 'el-ok' : 'el-no'}
                          ${ accountTaskHelper.getEntityTasks(a._id).length ? 'fieldBlink' : '' }
                          ${ stateResStatusHelper.getByID(a._id, 0)[1] === 'ok' ? 'resOK' : '' }
                          ${ stateResStatusHelper.getByID(a._id, 0)[1] === 'fail' ? 'resFail' : '' }
                        `}
                        data-idx={idx} key={idx}
                      >
                        <td className='overflow-scroll truncate max-w-2' data-type='extend' >{a.domainEmail}</td>
                        <td className='overflow-scroll truncate' data-type='extend' >{fmtCredits(a.emailCreditsLimit, a.emailCreditsUsed)}</td>
                        <td className='overflow-scroll truncate' data-type='extend' >{a.verified}</td>
                        <td className='overflow-scroll truncate' data-type='extend' >{a.suspended ? 'yes' : 'no'}</td>
                        <td className='overflow-scroll truncate' data-type='extend' >{fmtDate(a.lastUsed)}</td>
                        <td className='overflow-scroll truncate' data-type='extend' >{a.accountType}</td>
                        <td className='overflow-scroll truncate' data-type='extend' >{fmtDate(a.trialTime)}</td>
                        <td className='overflow-scroll sticky bg-black right-0' data-type='opt'>
                          <button >
                            <SlOptionsVertical className='inline'/>
                          </button>
                        </td>
                      </tr>

                      {/* OTHER TABLE */}
                      <tr className="hidden text-left">
                      <table className={`hidden border-cyan-600 border-y text-[0.7rem] w-[2000px] ${a.emailCreditsUsed !== a.emailCreditsLimit  ? 'el-ok' : 'el-no'} opacity-95`}>
                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2 w-4">Domain Email:</th>
                          <td className="px-2">{a.domainEmail}</td>
                        </tr>

                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2 w-4">Password:</th>
                          <td className="px-2">{a.apolloPassword}</td>
                        </tr>

                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2 w-4">Credits Used:</th>
                          <td className="px-2">{a.emailCreditsUsed === -1 ? "N/A" : a.emailCreditsUsed}</td>
                        </tr>

                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2 w-4">Credits Limit:</th>
                          <td className="px-2">{a.emailCreditsLimit === -1 ? "N/A" : a.emailCreditsLimit}</td>
                        </tr>

                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2 w-4">Credits Renewal Date:</th>
                          <td className="px-2">{fmtDate(a.renewalEndDate)}</td>
                        </tr>

                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2 w-4">Trial Days Left:</th>
                          <td className="px-2">{a.trialDaysLeft === -1 ? 'N/A' : a.trialDaysLeft}</td>
                        </tr>

                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2 w-4">Is Suspended ?:</th>
                          <td className="px-2">{a.suspended ? "yes" : 'no'}</td>
                        </tr>

                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2 w-4">Email:</th>
                          <td className="px-2">{a.email}</td>
                        </tr>

                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2 w-4">Logged In ?:</th>
                          <td className="px-2">{a.cookie ? 'yes' : 'no'}</td>
                        </tr>

                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2 w-4">Proxy:</th>
                          <td className="px-2">{a.proxy ? a.proxy : 'N/A'}</td>
                        </tr>

                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2 w-4">Trial:</th>
                          <td className="px-2">{fmtDate(a.trialTime)}</td>
                        </tr>

                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2 w-4">Last Used:</th>
                          <td className="px-2">{fmtDate(a.lastUsed)}</td>
                        </tr>

                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2 w-4">History:</th>
                          <td className="px-2">
                            <table className='text-center'>
                              <thead className='sticky top-0 bg-black opacity-100'>
                                <tr>
                                  <th className='px-2'> Amount Scraped </th>
                                  <th className='px-2'> Time Of Scraped </th>
                                  <th className='px-2'> ListName </th>
                                </tr>
                              </thead>
                              <tbody>
                                {
                                  a.history.map((h, idx) => (
                                    <tr key={idx}>
                                      <td className='overflow-scroll truncate' >{h[0] || "N/A"}</td>
                                      <td className='overflow-scroll truncate' >{fmtDate(h[1])}</td>
                                      <td className='overflow-scroll truncate' >{h[2] || "N/A"} </td>
                                    </tr>
                                  ))
                                }
                                <tr>
                                  <td className='overflow-scroll bg-cyan-500/90 font-bold border-t-2' >
                                    {
                                      a.history.reduce((acc, cur) => {
                                        const o = (typeof cur[0] !== 'number') ? 0 : cur[0]
                                        return acc + o
                                      }, 0)
                                    }
                                  </td>
                                  <div className="bg-cyan-500/90 font-bold border-t-2">TOTAL LEADS SCRAPED</div>
                                </tr>
                              </tbody>
                            </table>
                          </td>
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
  accountTaskHelper: ReturnType<typeof TaskHelpers<AccountReqType>>
  stateResStatusHelper: ReturnType<typeof ResStatusHelpers<AccountReqType>>
}

export const EmailForm = (props: EmailProps) => {
  const isCreateReq = !!accountTaskHelper.findTaskByReqType('account', 'create')

  return(
    <form onSubmit={props.addAccount}>
      <div className='flex basis-1/2 gap-5'>
        <div>
          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2' htmlFor="email">Email:</label>
            <input 
              disabled={isCreateReq}
              className={`
                ${ props.accountTaskHelper.getTaskByReqType('create')[0] ? 'fieldBlink' : '' }
                ${ props.stateResStatusHelper.getByID('account', 0)[1] === 'ok' ? 'resOK' : '' }
                ${ props.stateResStatusHelper.getByID('account', 0)[1] === 'fail' ? 'resFail' : '' }
              `}
              required type="text" id="email" value={props.input.email.get()} onChange={ e => {props.input.set(p => ({...p, email: e.target.value}))}}/>
          </div>

          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2' htmlFor="password">Password:</label>
            <input 
              disabled={isCreateReq}
              className={`
                ${ props.accountTaskHelper.getTaskByReqType('create')[0] ? 'fieldBlink' : '' }
                ${ props.stateResStatusHelper.getByID('account', 0)[1] === 'ok' ? 'resOK' : '' }
                ${ props.stateResStatusHelper.getByID('account', 0)[1] === 'fail' ? 'resFail' : '' }
              `}
              required type="text" id="password" value={props.input.password.get()} onChange={ e => {props.input.set(p => ({...p, password: e.target.value}))}}/>
          </div>
        </div>

        {/* <div>
          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2 mb-1' htmlFor="domain">Alias Email:</label>
            <input 
              disabled={isCreateReq}
              className={`
                ${ props.accountTaskHelper.getTaskByReqType('create')[0] ? 'fieldBlink' : '' }
                ${ props.stateResStatusHelper.getByID('account', 0)[1] === 'ok' ? 'resOK' : '' }
                ${ props.stateResStatusHelper.getByID('account', 0)[1] === 'fail' ? 'resFail' : '' }
              `}
              type="text" id="domain" value={props.input.domainEmail.get()} onChange={ e => {props.input.set(p => ({...p, domainEmail: e.target.value}))}}/>
          </div>

          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2 mb-1' htmlFor="recovery">Recovery Email:</label>
            <input 
              disabled={isCreateReq}
              className={`
                ${ props.accountTaskHelper.getTaskByReqType('create')[0] ? 'fieldBlink' : '' }
                ${ props.stateResStatusHelper.getByID('account', 0)[1] === 'ok' ? 'resOK' : '' }
                ${ props.stateResStatusHelper.getByID('account', 0)[1] === 'fail' ? 'resFail' : '' }
              `}
              type="text" id="recovery" value={props.input.recoveryEmail.get()} onChange={ e => {props.input.set(p => ({...p, recoveryEmail: e.target.value}))}}/>
          </div>
        </div> */}
      </div>
      <input disabled={isCreateReq} className='text-cyan-600 border-cyan-600 border rounded p-1' type="submit" value="Add Account"/>
    </form>
  )
}

type DomainProps = {
  domains: IDomain[]
  addAccount: (e: FormEvent<HTMLFormElement>) => Promise<void>
  selectedDomain: ObservableObject<string>
  accountTaskHelper: ReturnType<typeof TaskHelpers<AccountReqType>>
  stateResStatusHelper: ReturnType<typeof ResStatusHelpers<AccountReqType>>
}

export const DomainForm = (props: DomainProps) => {
  const isCreateReq = !!accountTaskHelper.findTaskByReqType('account', 'create')

  return (
    <form onSubmit={props.addAccount}>
      <div className='flex basis-1/2 gap-5 mt-1 mb-3'>
      <label htmlFor="domain">Select a domain:</label>

      <select
        disabled={isCreateReq}
        id="domain"
        onChange={e => props.selectedDomain.set(e.target.value)}
        className={`
          ${ props.accountTaskHelper.getTaskByReqType('create')[0] ? 'fieldBlink' : '' }
          ${ props.stateResStatusHelper.getByID('create', 0)[1] === 'ok' ? 'resOK' : '' }
          ${ props.stateResStatusHelper.getByID('create', 0)[1] === 'fail' ? 'resFail' : '' }
        `}
        value={props.selectedDomain.get()}
      >
        {
          props
            .domains
            .filter(d => d.verified === true)
            .map( (d, idx) => {
              if (idx === 0) props.selectedDomain.set(d.domain)
              return <option key={idx} value={d.domain}>{d.domain}</option>
            })
        }
      </select>
      </div>
      <input disabled={isCreateReq} className='text-cyan-600 border-cyan-600 border rounded p-1' type="submit" value="Add Account"/>
    </form>
  )
}