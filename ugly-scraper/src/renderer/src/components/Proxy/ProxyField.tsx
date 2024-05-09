import { FormEvent, useEffect, useState, Dispatch, ChangeEvent, MouseEvent } from 'react'
import { fetchData } from '../core/util'
import { SlOptionsVertical } from 'react-icons/sl'
import { IoOptionsOutline } from 'react-icons/io5'
import { ProxyPopup } from './ProxyPopup'
import { proxyMockData } from '../core/mockdata'

export type IProxy = {
  id: string
  protocol: string
  host: string
  port: string
}

type InputDispatch = Dispatch<React.SetStateAction<InputState>>

type InputState = {
  http: {
    http_full: string
    http_split: {
      protocol: string
      host: string
      port: string
    }
  }
  socks: {
    socks_full: string
    socks_split: {
      protocol: string
      host: string
      port: string
    }
  }
}

type InputSubCompArgs = { input: InputState; setInput: InputDispatch }

const proxy = () => ({
  http_full: '',
  http_split: {
    protocol: 'https',
    host: '',
    port: ''
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

export const ProxyField = () => {
  const [selectedProxy, setSelectedProxy] = useState<number | null>(null)
  const [selected, setSelected] = useState('http_full')
  const [input, setInput] = useState<InputState>({
    http: proxy(),
    socks: socks()
  })
  const [proxies, setProxies] = useState<IProxy[]>(proxyMockData)
  const [reqInProcess, setreqInProcess] = useState<boolean>(false)

  useEffect(() => {
    fetchData<IProxy[]>('/proxy', 'GET').then((data) => setProxies(data.data))
  }, [])

  let ProxyComponent: (input: InputState, setInput: InputDispatch) => JSX.Element

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setreqInProcess(true)
    let data: { [key: string]: string } = {}

    switch (selected) {
      case 'http_full':
        data = { proxy: input.http.http_full }
        break
      case 'http_split':
        data = {
          proxy: `${input.http.http_split.protocol}://${input.http.http_split.host}:${input.http.http_split.port}`
        }
        break
      case 'socks_full':
        data = { proxy: input.socks.socks_full }
        break
      case 'socks_split':
        data = {
          proxy: `${input.socks.socks_split.protocol}://${input.socks.socks_split.host}:${input.socks.socks_split.port}`
        }
        break
    }

    await fetchData('/addproxy', 'POST', data)
      .then((d) => {
        if (d.data.valid === true) {
          setProxies((p) => [...p, d.data.data])
        }

        console.log('here')

        setreqInProcess(false)
      })
      .catch((err: any) => {
        console.log(err.message)
        setreqInProcess(false)
      })
  }

  switch (selected) {
    case 'http_full':
      //@ts-ignore
      ProxyComponent = ProxyFull
      break
    case 'http_split':
      //@ts-ignore
      ProxyComponent = ProxySplit
      break
    case 'socks_full':
      //@ts-ignore
      ProxyComponent = SocksFull
      break
    case 'socks_split':
      //@ts-ignore
      ProxyComponent = SocksSplit
      break
  }

  const cls = (n: string) =>
    `mr-2 border-cyan-600 border rounded p-1 ${selected === n ? 'text-neutral-500 border-neutral-500' : ''}`

  const handleOptsClick = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    //@ts-ignore
    const type = e.target.closest('td')?.dataset.type as string

    switch (type) {
      case 'opt':
        //@ts-ignore
        const accIdx = e.target.closest('tr').dataset.idx
        setSelectedProxy(accIdx)
        break
    }
  }

  const PopupComp = () =>
    selectedProxy ? <ProxyPopup setPopup={setSelectedProxy} proxy={proxies[selectedProxy]} /> : null

  return (
    <>
      <PopupComp />
      <div className="flex relative grow text-xs">
        <div className="flex flex-col grow absolute inset-x-0 inset-y-0">
          <div className="mb-2">
            <div className="mb-2">
              <button className={cls('http_full')} onClick={() => setSelected('http_full')}>
                HTTP Full
              </button>
              <button className={cls('http_split')} onClick={() => setSelected('http_split')}>
                HTTP Split
              </button>
              <button className={cls('socks_full')} onClick={() => setSelected('socks_full')}>
                Socks Full
              </button>
              <button className={cls('socks_split')} onClick={() => setSelected('socks_split')}>
                Socks Split
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* @ts-ignore */}
              <ProxyComponent input={input} setInput={setInput} />
              <input
                disabled={reqInProcess}
                className="text-cyan-600 border-cyan-600 border rounded p-1 mt-3 disabled:border-neutral-500 disabled:text-neutral-500"
                type="submit"
                value="Add Proxy"
              />
            </form>
          </div>

          <div className="border-cyan-600 border rounded grow overflow-auto">
            <table className="text-[0.7rem] m-auto w-full table-fixed">
              <thead className="sticky top-0 bg-black">
                <tr>
                  <th>Protocol</th>
                  <th>Host</th>
                  <th>Port</th>
                  <th className="w-[10%]">
                    <IoOptionsOutline className="inline" />
                  </th>
                </tr>
              </thead>
              <tbody className="text-[0.5rem]" onClick={handleOptsClick}>
                {proxies.length &&
                  proxies.map((a, idx) => (
                    <tr
                      className="text-center hover:border-cyan-600 hover:border"
                      data-idx={idx}
                      key={idx}
                    >
                      <td className="overflow-scroll">{a.protocol}</td>
                      <td className="overflow-scroll">{a.host}</td>
                      <td className="overflow-scroll">{a.port}</td>
                      <td className="overflow-scroll" data-type="opt">
                        <button>
                          <SlOptionsVertical className="inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

const ProxyFull = ({ input, setInput }: InputSubCompArgs) => {
  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    setInput((p) => ({
      ...p,
      http: {
        ...p.http,
        http_full: e.target.value
      }
    }))
  }

  return (
    <div className="flex">
      <h4 className="mr-4 border-cyan-600 border-b-2">HTTP: </h4>
      <input required value={input.http.http_full} onChange={handleInput} />
    </div>
  )
}

const ProxySplit = ({ input, setInput }: InputSubCompArgs) => {
  const handleInput = (e: ChangeEvent<HTMLSelectElement> | ChangeEvent<HTMLInputElement>) => {
    setInput((p) => ({
      ...p,
      http: {
        ...p.http,
        ['http_split']: {
          ...p.http.http_split,
          [e.target.getAttribute('data-field')!]: e.target.value
        }
      }
    }))
  }

  return (
    <div>
      <div className="flex mb-2">
        <h4 className="mr-4 border-cyan-600 border-b-2">Protocol: </h4>
        <select
          id="protocol"
          name="protocol"
          value={input.http.http_split.protocol}
          onChange={handleInput}
          data-field="protocol"
        >
          <option value="https">HTTPS</option>
          <option value="http">HTTP</option>
        </select>
      </div>
      <div className="flex mb-2">
        <h4 className="mr-4 border-cyan-600 border-b-2">Host: </h4>
        <input value={input.http.http_split.host} onChange={handleInput} data-field="host" />
      </div>
      <div className="flex mb-2">
        <h4 className="mr-4 border-cyan-600 border-b-2">Port: </h4>
        <input
          required
          value={input.http.http_split.port}
          onChange={handleInput}
          data-field="port"
        />
      </div>
    </div>
  )
}

const SocksFull = ({ input, setInput }: InputSubCompArgs) => {
  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    setInput((s) => ({
      ...s,
      socks: {
        ...s.socks,
        socks_full: e.target.value
      }
    }))
  }

  return (
    <div className="flex mb-2">
      <h4 className="mr-4 border-cyan-600 border-b-2">Socks: </h4>
      <input required value={input.socks.socks_full} onChange={handleInput} />
    </div>
  )
}

const SocksSplit = ({ input, setInput }: InputSubCompArgs) => {
  const handleInput = (e: ChangeEvent<HTMLSelectElement> | ChangeEvent<HTMLInputElement>) => {
    setInput((s) => ({
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
      <div className="flex mb-2">
        <h4 className="mr-4 border-cyan-600 border-b-2">Protocol: </h4>
        <select
          id="protocol"
          name="protocol"
          value={input.socks.socks_split.protocol}
          onChange={handleInput}
          data-field="protocol"
        >
          <option value="socks5">Socks5</option>
          <option value="socks4">Socks4</option>
        </select>
      </div>

      <div className="flex mb-2">
        <h4 className="mr-4 border-cyan-600 border-b-2">Host: </h4>
        <input
          required
          value={input.socks.socks_split.host}
          onChange={handleInput}
          data-field="host"
        />
      </div>

      <div className="flex mb-2">
        <h4 className="mr-4 border-cyan-600 border-b-2">Port: </h4>
        <input
          required
          value={input.socks.socks_split.port}
          onChange={handleInput}
          data-field="port"
        />
      </div>
    </div>
  )
}
