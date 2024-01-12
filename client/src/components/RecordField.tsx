import { MouseEvent, useEffect, useState } from "react"
import {fetchData} from '../core/util';
import { SlOptionsVertical } from "react-icons/sl";

export type IMetaData = {
  _id: string
  url: string
  params: {[key: string]: string}
  fullURL: string
  name: string
  maxPages: string
  page: number
  scrapes: {page: number, scrapeID: string}[]
}

export type IRecords = {
  _id: string
  scrapeID: string
  url: string
  page: string
  data: IRecord
}

export type IRecord = {
  name: string
  linkedin: string
  title: string
  companyName: string
  companyURL: string
  comapnyLinkedin: string
  companyTwitter: string
  companyFacebook: string
  email: string
  isVerified: boolean
  location: string
  employees: string
  phone: string
  industry: string
  keywords: string[]
}

export const RecordField = () => {
  const [meta, setMeta] = useState<IMetaData[]>([]);
  const [records, setRecords] = useState<IRecords[]>([]);

  useEffect(() => {
    
    new Promise(async (resolve, _) => {
      const meta = await fetchData('/metadata', 'GET');
      const records = await fetchData('/records', 'GET');
      resolve({meta, records})
    })
    .then( (data: any) => {
      console.log(data.meta.data)
      setMeta(data.meta.data)
      setRecords(data.records.data)
    })
    .catch( (err: any) => {
      console.log('error')
      console.log(err.message)
    })

  }, [])

  const handleExtendRow = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    const type = e.target.closest('td')?.dataset.type as string

    switch (type) {
      case 'opt':
        console.log(e.target.closest('tr').dataset.idx)
        break;
      case 'extend':
        e.target.closest('tr').nextSibling?.firstElementChild?.classList.toggle('hidden')
        break;
    }
  }

  return (
    <div className="flex flex-col grow">

      <div className=' border-cyan-600 border rounded h-[25%] mb-6'>
        <table className="text-[0.7rem] m-auto w-full table-fixed">
          <thead>
            <tr>
              <th>Name</th>
              <th>URL</th>
              <th>MaxPages</th>
              <th className='w-[10%]'><SlOptionsVertical className='inline'/></th>
            </tr>
          </thead>
          <tbody className="text-[0.5rem]" onClick={handleExtendRow}>
          {
                meta.length && meta.map( 
                  (a, idx) => ( 
                    <>
                      <tr className='text-center hover:border-cyan-600 hover:border'  data-idx={idx} key={idx}>
                        <td className='overflow-scroll' data-type='extend' >{a.name}</td>
                        <td className='overflow-scroll' data-type='extend' >{a.url}</td>
                        <td className='overflow-scroll' data-type='extend' >{a.maxPages}</td>
                        <td className='overflow-scroll' data-type='opt'>
                          <button >
                            <SlOptionsVertical className='inline'/>
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="hidden hover:border-cyan-600 hover:border">
                          <div>url: {a.url}</div>
                          <div>params: {JSON.stringify(a.params)}</div>
                          <div>full url: {a.fullURL}</div>
                          <div>name: {a.name}</div>
                          <div>max pages: {a.maxPages}</div>
                          <div>page: {a.page}</div>
                          <div>scrapes: {JSON.stringify(a.scrapes)}</div>
                        </td>
                      </tr>
                    </>
                  )
                )
              }
          </tbody>
        </table>
      </div>

      <div className='border-cyan-600 border rounded grow overflow-scroll'>
        <table className="text-[0.7rem] m-auto w-full table-fixed">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Title</th>
              <th className='w-[10%]'><SlOptionsVertical className='inline'/></th>
            </tr>
          </thead>
          <tbody className="text-[0.5rem]" onClick={handleExtendRow}>
          {
                records.length && records.map( 
                  (a, idx) => ( 
                    <>
                      <tr className='text-center hover:border-cyan-600 hover:border'  data-idx={idx} key={idx}>
                        <td className='overflow-scroll' data-type='extend' >{a.data.name}</td>
                        <td className='overflow-scroll' data-type='extend' >{a.data.email}</td>
                        <td className='overflow-scroll' data-type='extend' >{a.data.title}</td>
                        <td className='overflow-scroll' data-type='opt'>
                          <button >
                            <SlOptionsVertical className='inline'/>
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="hidden hover:border-cyan-600 hover:border">
                          <div>name: {a.data.name}</div>
                          <div>linkedin: {a.data.linkedin}</div>
                          <div>title: {a.data.title}</div>
                          <div>company name: {a.data.companyName}</div>
                          <div>company url: {a.data.companyURL}</div>
                          <div>company linkedin: {a.data.comapnyLinkedin}</div>
                          <div>company twitter: {a.data.companyTwitter}</div>
                          <div>company facebook: {a.data.companyFacebook}</div>
                          <div>email: {a.data.email}</div>
                          <div>isVerified: {a.data.isVerified}</div>
                          <div>location: {a.data.location}</div>
                          <div>employees: {a.data.employees}</div>
                          <div>phone: {a.data.phone}</div>
                          <div>industry: {a.data.industry}</div>
                          <div>keywords: {a.data.keywords}</div>
                        </td>
                      </tr>
                    </>
                  )
                )
              }
          </tbody>
        </table>
      </div>

    </div>
  )
}