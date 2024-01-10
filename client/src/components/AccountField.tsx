import { FormEvent, useEffect, useState } from "react"
import {fetchData} from '../core/util';

export type IAccount = {
  domain: string
  accountType: string
  trialTime: string
  isSuspended: boolean
  apollo: {
    email: string
    password: string
  },
  cookies: string
  proxy: string
  lastUsed: Date
}

export const AccountField = () => {
  const [input, setInput] = useState({email: '', password: ''});
  const [accounts, setAccounts] = useState<IAccount[]>([])

  useEffect(() => {
    fetchData('/account', 'GET')
      .then(data => setAccounts(data.data))
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await fetchData('/addaccount', 'POST', input)
  }

  return (
    <div className="flex flex-col grow ">
      <div className='mb-10'>
        <form onSubmit={e => handleSubmit}>
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
      
      <div className=' border-cyan-600 border rounded grow overflow-scroll'>
        <table className="text-[0.7rem] m-auto w-full table-fixed">
          <thead>
            <tr>
              <th>Type</th>
              <th>Trial</th>
              <th>Email</th>
              <th>Password</th>
            </tr>
          </thead>
          <tbody className="text-[0.5rem]">
            {
              accounts.length && accounts.map( 
                (a, idx) => ( 
                  <tr className='text-center' key={idx}>
                    <td className='overflow-scroll'>{a.accountType}</td>
                    <td className='overflow-scroll'>{a.trialTime}</td>
                    <td className='overflow-scroll'>{a.apollo.email}</td>
                    <td className='overflow-scroll'>{a.apollo.password}</td>
                  </tr>
                )
              )
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}