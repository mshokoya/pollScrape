import { useState } from "react"
import {fetchData} from '../core/util';

export const AccountField = ({accountList}: {accountList: string[]}) => {
  const [input, setInput] = useState({email: '', password: ''})

  const handleSubmit = async (e) => {
    e.preventDefault()
    await fetchData('/addaccount', 'POST', input)
  }

  return (
    <div className="flex flex-col grow">
      <div className='mb-10'>
        <form onSubmit={handleSubmit}>
          <div className='mb-3'>
            <label className='mr-2' htmlFor="email">Email: </label>
            <input className='mr-5' type="text" id="email" value={input.email} onChange={ e => {setInput(p => ({...p, email: e.target.value}))}}/>
          </div>

          <div className='mb-3'>
            <label className='mr-2' htmlFor="password">Password: </label>
            <input className='mr-5' type="text" id="password" value={input.password} onChange={ e => {setInput(p => ({...p, password: e.target.value}))}}/>
          </div>

          <input className='text-cyan-600 border-cyan-600 border rounded p-1 mt-3' type="submit" value="Start Scraping"/>
        </form>
      </div>
      
      <div className='mr-2 border-cyan-600 border rounded grow'>
        <ul>
          {
            accountList && accountList.map(p => ( <div>{p}</div>))
          }
        </ul>
      </div>
    </div>
  )
}