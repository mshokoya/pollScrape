import { useState } from "react"
import {fetchData} from '../core/util';


const proxy = () => ({
  proxy_full: '',
  proxy_split: {
    protocol: '',
    host: '',
    port: '',
  }
})

const socks = () => ({
  socks_full: '',
  socks_split: {
    host: '',
    port: ''
  }
})

export const ProxyField = ({proxyList}: {proxyList: string[]}) => {
  const [selected, setSelected] = useState('proxy_full');
  const [input, setInput] = useState({
    proxy: proxy(),
    socks: socks()
  })

  let ProxyComponent: (input: any, setInput: any) => JSX.Element;

  const handleClick = async () => {
    switch (selected) {
      case 'proxy_full':
        await fetchData('/addproxy', 'POST', {url: input.proxy.proxy_full, type: 'proxy'})
        setInput(p => ({...p, proxy: proxy()}))
        break;
      case 'proxy_split':
        await fetchData('/addproxy', 'POST', {url: `${input.proxy.proxy_split.protocol}://${input.proxy.proxy_split.host}:${input.proxy.proxy_split.port}`, type: 'proxy'})
        setInput(p => ({...p, proxy: proxy()}))
        break;
      case 'socks_full':
        await fetchData('/addproxy', 'POST', {url: input.socks.socks_full, type: 'socks'})
        setInput(p => ({...p, socks: socks()}))
        break;
      case 'socks_split':
        await fetchData('/addproxy', 'POST', {url: `${input.socks.socks_split.host}:${input.socks.socks_split.port}`, type: 'socks'})
        setInput(p => ({...p, socks: socks()}))
        break;
    }

    console.log('end')
  }

  switch (selected) {
    case 'proxy_full':
      ProxyComponent = ProxyFull
      break;
    case 'proxy_split':
      ProxyComponent = ProxySplit
      break;
    case 'socks_full':
      ProxyComponent = SocksFull
      break;
    case 'socks_split':
      ProxyComponent = SocksSplit
      break;
  }

  return (
    <div className="flex flex-col grow">
      <div className='mb-10'>
        <div className="mb-4">
          <button className='mr-2 border-cyan-600 border rounded p-1' onClick={() => setSelected('proxy_full')}>Proxy Full</button>
          <button className='mr-2 border-cyan-600 border rounded p-1' onClick={() => setSelected('proxy_split')}>Proxy Split</button>
          <button className='mr-2 border-cyan-600 border rounded p-1' onClick={() => setSelected('socks_full')}>Socks5 Full</button>
          <button className=' border-cyan-600 border rounded p-1' onClick={() => setSelected('socks_split')}>Socks5 Split</button>
        </div>

        <ProxyComponent input={input} setInput={setInput} />
        
        <button className='text-cyan-600 border-cyan-600 border rounded p-1 mt-3' onClick={handleClick} >
          Add Proxy
        </button>
      </div>
      
      <div className='border-cyan-600 border rounded grow'>
        <ul>
          {
            proxyList && proxyList.map(p => ( <div>{p}</div>))
          }
        </ul>
      </div>
    </div>
  )
}

const ProxyFull = ({input, setInput}) => {
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(p => ({
      ...p,
      proxy: {
        ...p.proxy,
        proxy_full: e.target.value
      }
    }))
  }

  return (
    <div className="flex">
      <h4 className="mr-4 border-cyan-600 border-b-2">Proxy: </h4>
      <input 
        value={input.proxy.proxy_full} 
        onChange={handleInput}
      />
    </div>
  )
}

const ProxySplit = ({input, setInput}) => {

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(p => ({
      ...p,
      proxy: {
        ...p.proxy,
        ['proxy_split']: {
          ...p.proxy.proxy_split,
          [e.target.getAttribute('data-field')!]: e.target.value
        }
      }
    }))
  }

  return (
    <div>
      <div className='flex mb-2'>
        <h4 className="mr-4 border-cyan-600 border-b-2">Protocol: </h4>
        <input 
          value={input.proxy.proxy_split.protocol} 
          onChange={handleInput}
          data-field='protocol'
        />
      </div>
      <div className='flex mb-2'>
        <h4 className="mr-4 border-cyan-600 border-b-2">Host: </h4>
        <input 
          value={input.proxy.proxy_split.host} 
          onChange={handleInput}
          data-field='host'
        />
      </div>
      <div className='flex mb-2'>
        <h4 className="mr-4 border-cyan-600 border-b-2">Port: </h4>
        <input 
          value={input.proxy.proxy_split.port} 
          onChange={handleInput}
          data-field='port'
        />
      </div>
    </div>
    
  )
}

const SocksFull = ({input, setInput}) => {
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(s => ({
      ...s,
      socks: {
        ...s.socks,
        socks_full: e.target.value
      }
    }))
  }

  return (
    <div className='flex mb-2'>
      <h4 className="mr-4 border-cyan-600 border-b-2">Socks5: </h4>
      <input 
        value={input.socks.socks_full} 
        onChange={handleInput}
      />
    </div>
  )
}

const SocksSplit = ({input, setInput}) => {

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(s => ({
      ...s,
      socks: {
        ...s.socks,
        ['socks_split']: {
          ...s.socks.socks_split,
          [e.target.getAttribute('data-field')!]: e.target.value
        }
      }
    }))
  }

  return (
    <div>
      <div className='flex mb-2'>
        <h4 className="mr-4 border-cyan-600 border-b-2">Host: </h4>
        <input 
          value={input.socks.socks_split.host} 
          onChange={handleInput}
          data-field='host'
        />
      </div>
      <div className='flex mb-2'>
        <h4 className="mr-4 border-cyan-600 border-b-2">Port: </h4>
        <input 
          value={input.socks.socks_full.port} 
          onChange={handleInput}
          data-field='port'
        />
      </div>
    </div>
  )
}