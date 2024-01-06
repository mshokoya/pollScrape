import { useState } from "react"
import {fetchData} from '../core/util';


const proxy = () => ({
  proxy_full: '',
  proxy_split: {
    protocol: 'https',
    host: '',
    port: '',
  }
})

const socks = () => ({
  socks_full: '',
  socks_split: {
    protocol: 'socks5',
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
    let data: {[key: string]: string} = {};

    switch (selected) {
      case 'proxy_full':
        data = {url: input.proxy.proxy_full};
        // setInput(p => ({...p, proxy: proxy()}));
        break;
      case 'proxy_split':
        data = {url: `${input.proxy.proxy_split.protocol}://${input.proxy.proxy_split.host}:${input.proxy.proxy_split.port}`};
        // setInput(p => ({...p, proxy: proxy()}))
        break;
      case 'socks_full':
        data = {url: input.socks.socks_full};
        // setInput(p => ({...p, socks: socks()}))
        break;
      case 'socks_split':
        data = {url: `${input.socks.socks_split.protocol}://${input.socks.socks_split.host}:${input.socks.socks_split.port}`}
        // setInput(p => ({...p, socks: socks()}))
        break;
    }

    console.log(data)

    const res = await fetchData('/addproxy', 'POST', data)

    console.log(res)
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
    <div className="flex flex-col grow ">
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
        <select id="protocol" name="protocol" value={input.proxy.proxy_split.protocol} onChange={handleInput} data-field='protocol'>
          <option value="https">HTTPS</option>
          <option value="http">HTTP</option>
        </select>
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
        <h4 className="mr-4 border-cyan-600 border-b-2">Protocol: </h4>
        <select id="protocol" name="protocol" value={input.socks.socks_split.protocol} onChange={handleInput} data-field='protocol'>
          <option value="socks5">Socks5</option>
          <option value="socks4">Socks4</option>
        </select>
      </div>

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
          value={input.socks.socks_split.port} 
          onChange={handleInput}
          data-field='port'
        />
      </div>
    </div>
  )
}