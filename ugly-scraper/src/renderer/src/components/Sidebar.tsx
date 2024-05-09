import { useState } from 'react'
// import { ProxyField } from './ProxyField'
import { AccountField } from './AccountField'
import { DomainField } from './DomainField'
import { Separator } from '@radix-ui/themes'

export const Sidebar = () => {
  const [toggle, setToggle] = useState(true)

  return (
    <div className="h-full bg-black">
      <div
        className={`${toggle && 'hidden'} absolute top-0 bottom-0 left-0 right-0`}
        style={{ background: 'rgba(0,0,0,.70)' }}
        onClick={() => setToggle(!toggle)}
      />

      <div
        className={`${toggle && 'hidden'} overflow-scroll bg-[#111111] absolute top-0 bottom-0 right-[1.25rem] w-[40rem] z-200 flex flex-col p-2 gap-2 border-l-4 border-cyan-500`}
      >
        {/* DOMAIN */}
        <div className="flex flex-col basis-[80%]">
          <h2 className=" mb-1">DOMAINS</h2>
          <DomainField />
        </div>

        <Separator my="2" size="4" />

        {/* ACCOUNTS */}
        <div className="flex flex-col basis-full">
          <h2 className=" mb-1">ACCOUNTS</h2>
          <AccountField />
        </div>

        {/* PROXIES
        <div className='flex flex-col basis-full'>
          <h2 className=' mb-1'>PROXIES</h2>
          <ProxyField />
        </div> */}
      </div>

      <div className="h-full w-5 bg-cyan-500 z-3000" onClick={() => setToggle(!toggle)} />
    </div>
  )
}
