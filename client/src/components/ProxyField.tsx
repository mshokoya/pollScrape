import { useState } from "react"


const proxy = () => ({
  proxy_full: "proxy fulla",
  proxy_split: {
    protocol: "proxy proto",
    host: 'proxy host',
    port: 'proxy port',
  }
})

const socks = () => ({
  socks_full: 'socks full',
  socks_split: {
    host: 'socks host',
    port: 'socks port'
  }
})

export const ProxyField = ({proxyList}: {proxyList: string[]}) => {
  const [selected, setSelected] = useState('proxy_full');
  const [input, setInput] = useState({
    proxy: proxy(),
    socks: socks()
  })

  let ProxyComponent: (input: any, setInput: any) => JSX.Element;

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
    <div>
      <div>
        <div className="mb-4">
          <button className='mr-2 border-cyan-600 border rounded p-1' onClick={() => setSelected('proxy_full')}>Proxy Full</button>
          <button className='mr-2 border-cyan-600 border rounded p-1' onClick={() => setSelected('proxy_split')}>Proxy Split</button>
          <button className='mr-2 border-cyan-600 border rounded p-1' onClick={() => setSelected('socks_full')}>Socks5 Full</button>
          <button className='mr-2 border-cyan-600 border rounded p-1' onClick={() => setSelected('socks_split')}>Socks5 Split</button>
        </div>

        <ProxyComponent input={input} setInput={setInput} />
        
        <button className='text-cyan-600 border-cyan-600 border rounded p-1 mt-3' type="submit">
          Add Proxy
        </button>
      </div>
      

      <div>
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
    console.log(e.target.value)
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
      <h4 className="mr-4 border-cyan-600 border-b-2">Proxy</h4>
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
      <div>
        <h4>Protocol</h4>
        <input 
          value={input.proxy.proxy_split.protocol} 
          onChange={handleInput}
          data-field='protocol'
        />
      </div>
      <div>
        <h4>Host</h4>
        <input 
          value={input.proxy.proxy_split.host} 
          onChange={handleInput}
          data-field='host'
        />
      </div>
      <div>
        <h4>Port</h4>
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
    <div>
      <h4>Socks5</h4>
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
      <div>
        <h4>Host</h4>
        <input 
          value={input.socks.socks_split.host} 
          onChange={handleInput}
          data-field='host'
        />
      </div>
      <div>
        <h4>Port</h4>
        <input 
          value={input.socks.socks_full.port} 
          onChange={handleInput}
          data-field='port'
        />
      </div>
    </div>
    
  )
}