
import { ProxyField } from './components/ProxyField';
import { AccountField } from './components/AccountField';
import { RecordField } from './components/RecordField';
import { ScrapeField } from './components/ScrapeField';
import { AccountPopup } from './components/AccountPopup';
import { useState } from 'react';

const ACCOUNT_POPUP = 'account'
const PROXY_POPUP = 'proxy'
const META_POPUP = 'meta'
const RECORDS_POPUP = 'record'
const NO_POPUP = ''

function App() {

  return (
    <div className='flex flex-col center h-screen z-0'>

      <div className='mb-4 text-center'>
        <h2 className='text-[2rem] mb-3'>Apollo URL To Scrape</h2>
        <ScrapeField />
      </div>

      <div className='flex flex-auto justify-between grow gap-5 p-5'>
        {/* PROXIES */}
        <div className='flex flex-col basis-full'>
          <h2 className='text-[2rem] mb-3'>PROXIES</h2>
          <ProxyField />
        </div>

        {/* ACCOUNTS */}
        <div className='flex flex-col basis-full'>
          <h2 className='text-[2rem] mb-3'>ACCOUNTS</h2>
          <AccountField />
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