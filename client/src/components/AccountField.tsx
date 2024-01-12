import { FormEvent, MouseEvent, useEffect, useState } from "react"
import {fetchData} from '../core/util';
import { SlOptionsVertical } from "react-icons/sl";
import { IoOptionsOutline } from "react-icons/io5";

export type IAccount = {
  _id: string
  domain: string
  accountType: string
  trialTime: Date
  isSuspended: boolean
  email: string
  password: string
  cookies: string
  proxy: string
  lastUsed: Date
}

// https://jsfiddle.net/mfwYS/

export const AccountField = () => {
  const [input, setInput] = useState({email: '', password: ''});
  const [accounts, setAccounts] = useState<IAccount[]>([
    {_id: '12345', domain: 'domain', accountType: 'free', trialTime: new Date(), isSuspended: false, email: 'ms@h.co.uk', password: 'pass', cookies: 'dasdasdas', proxy: 'dsaasd', lastUsed: new Date()},
    {_id: '54321', domain: 'domain2', accountType: 'prem', trialTime: new Date(), isSuspended: false, email: 'ms22@h.co.uk', password: 'pass2', cookies: 'dasdasdas22', proxy: 'dsaasd222', lastUsed: new Date()},
    {_id: '12345', domain: 'domain', accountType: 'free', trialTime: new Date(), isSuspended: false, email: 'ms@h.co.uk', password: 'pass', cookies: 'dasdasdas', proxy: 'dsaasd', lastUsed: new Date()},
    {_id: '54321', domain: 'domain2', accountType: 'prem', trialTime: new Date(), isSuspended: false, email: 'ms22@h.co.uk', password: 'pass2', cookies: 'dasdasdas22', proxy: 'dsaasd222', lastUsed: new Date()}
  ])

  // useEffect(() => {
  //   fetchData('/account', 'GET')
  //     .then(data => setAccounts(data.data))
  // }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await fetchData('/account', 'POST', input)
  }

  const handleExtendRow = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    e.target.closest('tr').nextSibling?.firstElementChild?.classList.toggle('hidden')
  }

  return (
    <div className="flex flex-col grow">
      <div className='mb-10'>
        <form onSubmit={handleSubmit}>
          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2' htmlFor="email">Email:</label>
            <input required type="text" id="email" value={input.email} onChange={ e => {setInput(p => ({...p, email: e.target.value}))}}/>
          </div>

          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2' htmlFor="password">Password:</label>
            <input required type="text" id="password" value={input.password} onChange={ e => {setInput(p => ({...p, password: e.target.value}))}}/>
          </div>

          <input className='text-cyan-600 border-cyan-600 border rounded p-1 mt-3' type="submit" value="Add Account"/>
        </form>
      </div>
      
      <div className='border-cyan-600 border rounded grow'>
        <table className="text-[0.7rem] m-auto w-full table-fixed">
          <thead>
            <tr>
              <th>Trial</th>
              <th>Email</th>
              <th>Password</th>
              <th className='w-[10%]'><IoOptionsOutline className='inline' /></th>
            </tr>
          </thead>
          <tbody className="text-[0.5rem]" onClick={handleExtendRow}>
            {
              accounts.length && accounts.map( 
                (a, idx) => ( 
                  <>
                    <tr className='text-center' key={idx}>
                      <td className='overflow-scroll'>{a.trialTime.toDateString()}</td>
                      <td className='overflow-scroll'>{a.email}</td>
                      <td className='overflow-scroll'>{a.password}</td>
                      <td className='overflow-scroll' ><SlOptionsVertical className='inline'/></td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="hidden">
                        <div>_id: {a._id}</div>
                        <div>domain: {a.domain}</div>
                        <div>accountType: {a.accountType}</div>
                        <div>trialTime: {a.trialTime.toDateString()}</div>
                        <div>isSuspended: {a.isSuspended}</div>
                        <div>email: {a.email}</div>
                        <div>password: {a.password}</div>
                        <div>cookies: {a.cookies}</div>
                        <div>proxy: {a.proxy}</div>
                        <div>lastUsed: {a.lastUsed.toDateString()}</div>
                      </td>
                    </tr>
                  </>
                )
              )
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}