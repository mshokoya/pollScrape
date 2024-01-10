import {useState, FormEvent} from 'react';
import { ProxyField } from './components/ProxyField';
import { AccountField } from './components/AccountField';
import { RecordField } from './components/RecordField';
import { ScrapeField } from './components/ScrapeField';


function App() {

  return (
    <div className='flex flex-col center h-screen'>

      <div className='mb-4 text-center'>
        <h2 className='text-[2rem] mb-3'>Apollo URL To Scrape</h2>
        <ScrapeField />
      </div>

      <div className='flex flex-auto justify-between grow gap-5 p-5'>
        {/* PROXIES */}
        <div className='flex flex-col basis-full'>
          <h2 className='text-[2rem] mb-3'>PROXIES</h2>
          <ProxyField proxyList={[]} />
        </div>

        {/* ACCOUNTS */}
        <div className='flex flex-col basis-full'>
          <h2 className='text-[2rem] mb-3'>ACCOUNTS</h2>
          <AccountField accountList={[]} />
        </div>

        {/* RECORDS */}
        <div className='flex flex-col basis-full'>
          <h2 className='text-[2rem] mb-3'>RECORDS</h2>
          <RecordField recordList={[]}/>
        </div>
      </div>

    </div>
  )
}

export default App