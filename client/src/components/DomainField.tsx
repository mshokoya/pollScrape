import { FormEvent, MouseEvent, useEffect, useState } from "react"
import {fetchData} from '../core/util';
import { SlOptionsVertical } from "react-icons/sl";
import { IoOptionsOutline } from "react-icons/io5";
import { DomainPopup } from "./DomainPopup";



export type IDomain = {
  _id: string
  domain: string
  authEmail: string
  verified: boolean
  MXRecords: boolean,
  TXTRecords: boolean,
  VerifyMessage: string
}

export const DomainField = () => {
  const [input, setInput] = useState({email: '', domain: ''});
  const [selectedDomain, setSelectedDomain] = useState<number | null>(0)
  const [reqInProcess, setReqInProcess] = useState<string[]>([])
  const [reqType, setReqType] = useState<string | null>(null)
  const [resStatus, setResStatus] = useState<
  [
    'ok' | 'fail' | null, 
    string | null
  ] | null>(null)
  const [domains, setDomains] = useState<IDomain[]>([
    // {domain: 'tess@test.com', authEmail: 'e@g.com', verified: false, _id: 'ds', MXRecords: true, TXTRecords: true, VerifyMessage: ''}
  ])

  useEffect(() => {
    fetchData<IDomain[]>('/account/domain', 'GET')
      .then(data => {
        setDomains([...domains, ...data.data])
      })
      .catch(() => {})
  }, [])

  const handleExtendRow = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    //@ts-ignore
    const type = e.target.closest('td')?.dataset.type as string

    switch (type) {
      case 'opt':
        //@ts-ignore
        const domainIdx = e.target.closest('tr').dataset.idx;
        setSelectedDomain(domainIdx)
        break;
      case 'extend':
        //@ts-ignore
        e.target.closest('tr').nextSibling.classList.toggle('hidden')
        //@ts-ignore
        e.target.closest('tr').nextSibling.firstElementChild?.classList.toggle('hidden')
        break;
    }
  }
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setReqInProcess([...reqInProcess, 'new'])
    setReqType('create')
    await fetchData<IDomain>('/domain', 'POST', input)
      .then((d) => {
        if (d.ok) {
          setResStatus(['ok', 'new'])
          setDomains([...domains, d.data])
        } else {
          setResStatus(['fail', 'new'])
        }
      })
      .catch(() => { setResStatus(['fail', 'new']) })
      .finally(() => {
        setTimeout(() => {
          setReqInProcess(reqInProcess.filter(d => d !== 'new'))
          setReqType(null)
          setResStatus(null)
        }, 1500)
      })
  }

  const handleDeleteDomain = async () => {
    if (selectedDomain === null) return;
    const domainID = domains[selectedDomain]._id
    setReqInProcess([...reqInProcess, domainID])
    setReqType('delete')
    await fetchData<IDomain>(`/domain/${domains[selectedDomain].domain}`, 'DELETE')
      .then(res => {
        if (res.ok) {
          setResStatus(['ok', domainID])
          setDomains(domains.filter(d => d._id !== domainID))
        } else {
          setResStatus(['fail', domainID])
        }
      })
      .catch(() => { setResStatus(['fail', domainID]) })
      .finally(() => {
        setTimeout(() => {
          setReqType(null)
          setReqInProcess(reqInProcess.filter(d => d !== domainID))
          setResStatus(null)
        }, 1500)
      })
  }

  const handleVerifyDomain = async () => {
    if (selectedDomain === null) return;
    const domainID = domains[selectedDomain]._id
    setReqInProcess([...reqInProcess, domainID])
    setReqType('verify')
    await fetchData<IDomain>(`/domain/verify/${domains[selectedDomain].domain}`, 'GET')
      .then((res) => {
        const updatedDomains = domains.map(d => d.domain === res.data.domain ? res.data : d)
        setDomains( updatedDomains)

        res.data && res.data.verified
          ? setResStatus(['ok', domainID])
          : setResStatus(['fail', domainID])
      })
      .catch(() => { setResStatus(['fail', domainID]) })
      .finally(() => {
        setTimeout(() => { 
          setReqType(null)
          setReqInProcess(reqInProcess.filter(d => d !== domainID))
          setResStatus(null)
        }, 1500)
      })
  }

  const PopupComp = () => selectedDomain
      ? <DomainPopup
        req={reqType}
        setPopup={setSelectedDomain} 
        domain={domains[selectedDomain]} 
        verifyDomain={handleVerifyDomain}
        deleteDomain={handleDeleteDomain}
        reqInProcess={reqInProcess} 
        setReqInProcess={setReqInProcess}
      />
      : null;

  return (
    <>
    <PopupComp />
    <div className="flex relative grow text-xs">
      <div className="flex flex-col grow absolute inset-x-0 inset-y-0">
        <div className='mb-2'>
          <form onSubmit={handleSubmit}>

            <div className='mb-3'>
              <label className='mr-2 border-cyan-600 border-b-2' htmlFor="domain">Domain:</label>
              <input className={`
                ${ reqInProcess.includes('new') ? 'fieldBlink' : '' } 
                ${ resStatus && resStatus[0] === 'ok' && resStatus[1]!.includes('new') ? 'resOK' : '' } 
                ${ resStatus && resStatus[0] === 'fail' && resStatus[1]!.includes('new') ? 'resFail' : '' }
              `} 
              required type="text" id="domain" value={input.domain} onChange={ e => {setInput(p => ({...p, domain: e.target.value}))}}/>
            </div>

            <input disabled={reqInProcess.includes('new')} className='text-cyan-600 border-cyan-600 border rounded p-1' type="submit" value="Add Domain"/>
          
          </form>
        </div>
        
        <div className='border-cyan-600 border rounded grow overflow-auto'>
          <table className="text-[0.7rem] font-light m-auto table-fixed w-[120%]">
            <thead className='sticky top-0 bg-black'>
              <tr>
                <th>Domain</th>
                <th>Email ?</th>
                <th>Is Verified</th>
                <th className='w-[7%] sticky bg-black right-0'><IoOptionsOutline className='inline' /></th>
              </tr>
            </thead>
            <tbody className="text-[0.5rem]" onClick={handleExtendRow}>
              {
                domains.map(
                  (a, idx) => ( 
                    <>
                      <tr className={
                        `
                          ${a.verified ? 'el-ok' : 'el-no'} 
                          ${ reqInProcess.includes(a._id) ? 'fieldBlink' : '' } 
                          ${ resStatus && resStatus[0] === 'ok' && resStatus[1]!.includes(a._id) ? 'resOK' : '' } 
                          ${ resStatus && resStatus[0] === 'fail' && resStatus[1]!.includes(a._id) ? 'resFail' : '' } 
                          text-[0.8rem] text-center hover:border-cyan-600 hover:border
                        `
                        }  
                        data-idx={idx} 
                        key={idx}
                      >
                        <td className='overflow-scroll truncate' data-type='extend' >{a.domain}</td>
                        <td className='overflow-scroll truncate' data-type='extend' >{a.authEmail}</td>
                        <td className='overflow-scroll truncate' data-type='extend' >{a.verified ? 'yes' : 'no' }</td>
                        <td className='overflow-scroll sticky bg-black right-0' data-type='opt'>
                          <button >
                            <SlOptionsVertical className='inline'/>
                          </button>
                        </td>
                      </tr>
                      <tr className="hidden">
                      <table className="hidden border-cyan-600 border-y text-[0.7rem]">
                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2">Domain:</th>
                          <td className="px-2">{a.domain}</td>
                        </tr>
                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2">Email:</th>
                          <td className="px-2">{a.authEmail}</td>
                        </tr>
                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2">IsVerified:</th>
                          <td className="px-2">{a.verified}</td>
                        </tr>
                      </table>
                    </tr>
                  </>
                )
              )
            }
          </tbody>
        </table>

        </div>
      </div>
    </div>
  </>
  )
}