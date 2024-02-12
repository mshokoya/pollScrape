import { useState } from "react"
import { ProxyField } from "./ProxyField";
import { AccountField } from "./AccountField";
import { DomainField } from "./DomainField";

export const Sidebar = () => {
  const [toggle, setToggle] = useState(true);

  return (
    <div className='h-full bg-black'>
      <div className={`${toggle && 'hidden'} absolute top-0 bottom-0 left-0 right-[41.25rem] w-[68.75rem]`} onClick={_ => setToggle(!toggle)}/>
      
      <div className={`${toggle && 'hidden'} overflow-scroll bg-black absolute top-0 bottom-0 right-[1.25rem] w-[40rem] z-20 flex flex-col p-2 gap-2 border-l-4 border-cyan-500`}>
        {/* ACCOUNTS */}
        <div className='flex flex-col basis-[60%]'>
          <h2 className=' mb-1'>DOMAINS</h2>
          <DomainField />
        </div>

          {/* ACCOUNTS */}
        <div className='flex flex-col basis-full'>
          <h2 className=' mb-1'>ACCOUNTS</h2>
          <AccountField />
        </div>
        
        {/* PROXIES
        <div className='flex flex-col basis-full'>
          <h2 className=' mb-1'>PROXIES</h2>
          <ProxyField />
        </div> */}
      </div>

      <div className='h-full w-5 bg-cyan-500 z-300' onClick={_ => setToggle(!toggle)}/>
    </div>
  )
}