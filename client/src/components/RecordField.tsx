import { Dispatch, MouseEvent, SetStateAction, useEffect, useState } from "react"
import {fetchData, fmtDate} from '../core/util';
import { SlOptionsVertical } from "react-icons/sl";
import { IoOptionsOutline } from "react-icons/io5";
import { MdCheckBoxOutlineBlank } from "react-icons/md";
import { MdCheckBox } from "react-icons/md";
import { FaLinkedinIn } from "react-icons/fa";
import { BiLinkAlt } from "react-icons/bi";
import { FaTwitter } from "react-icons/fa";
import { FaFacebookF } from "react-icons/fa";
import { MetaPopup } from "./MetaPopup";
import { metaMockData, recordMockData } from "../core/mockdata";
import { appState$ } from "../core/state";

export type IMetaData = {
  _id: string
  url: string
  params: {[key: string]: string}
  name: string
  scrapes: {scrapeID: string, listName: string, length: number, date: number}[]
  accounts: {accountID: string, range:[min:number, max:number]}[]
}

export type IRecords = {
  _id: string
  scrapeID: string
  url: string
  page: number
  data: IRecord
}

export type IRecord = {
  Name: string
  Linkedin: string
  Title: string
  'Company Name': string
  'Company Website': string
  'Company Linkedin': string
  'Company Twitter': string
  'Company Facebook': string
  Email: string
  isVerified: boolean
  'Company Location': string
  Employees: string
  Phone: string
  Industry: string
  Keywords: string[]
}

// type MetaDispatch = Dispatch<SetStateAction<IMetaData[]>>
type MetaSubCompArgs = {meta: IMetaData[], metaChecked: number[], setMetaChecked: Dispatch<SetStateAction<number[]>>}
// type RecordsDispatch = Dispatch<SetStateAction<IRecords[]>>
type RecordsSubCompArgs = {records: IRecords[], recordsChecked: number[], setRecordsChecked: Dispatch<SetStateAction<number[]>>, meta: IMetaData[], metaChecked: number[]}

export const RecordField = () => {
  const [metaChecked, setMetaChecked] = useState<number[]>([]);
  const [recordsChecked, setRecordsChecked] = useState<number[]>([]);
  const [meta, setMeta] = useState<IMetaData[]>(metaMockData);
  const [records, setRecords] = useState<IRecords[]>(recordMockData);

  useEffect(() => {
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve) => {
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


  return (
    <div className="flex relative grow">
      <div className="flex gap-3 grow absolute inset-x-0 inset-y-0">
        <Meta meta={meta} metaChecked={metaChecked} setMetaChecked={setMetaChecked} />
        <Record records={records} recordsChecked={recordsChecked} setRecordsChecked={setRecordsChecked} meta={meta} metaChecked={metaChecked} />
      </div>
    </div>
  )
}

export const Meta = ({meta, metaChecked, setMetaChecked}: MetaSubCompArgs) => {
  const [selectedMeta, setSelectedMeta] = useState<number | null>(null)

  const handleExtendRow = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    //@ts-ignore
    const type = e.target.closest('td')?.dataset.type as string

    switch (type) {
      case 'opt':
        //@ts-ignore
        setSelectedMeta(e.target.closest('tr').dataset.idx)
        break;
      case 'check':
        //@ts-ignore
        const idx = parseInt(e.target.closest('tr').dataset.idx)
        metaChecked.includes(idx)
          ? setMetaChecked(p => p.filter(a => a !== idx))
          : setMetaChecked([...metaChecked, idx])
        break;
      case 'extend':
        //@ts-ignore
        e.target.closest('tr').nextSibling.classList.toggle('hidden')
        break;
    }
  }

  const handleMetaToggle = () => {
    metaChecked.length === meta.length
      ? setMetaChecked([])
      : setMetaChecked(meta.map((_, idx) => idx))
  }

  const PopupComp = () => selectedMeta
  ? <MetaPopup setPopup={setSelectedMeta} meta={meta[selectedMeta]} />
  : null;

  return (
    <>
    <PopupComp />
    <div className=' border-cyan-600 min-w-[30%] max-w-[30%] border rounded overflow-auto '>
    <table className="text-[0.7rem] font-light m-auto w-[150%] table-fixed">
      <thead className='sticky top-0 bg-black text text-[0.8rem]'>
        <tr>
          <th className='w-[7%]' onClick={handleMetaToggle}>
            {
              metaChecked.length === meta.length
                ? <MdCheckBox className='inline' />
                : <MdCheckBoxOutlineBlank className='inline' />
            }
          </th>
          <th>Name</th>
          <th>URL</th>
          <th className='w-7 sticky bg-black right-0'><IoOptionsOutline className='inline' /></th>
        </tr>
      </thead>
      <tbody className="text-[0.8rem] " onClick={handleExtendRow}>
      {
            meta.length && meta.map( 
              (a, idx) => ( 
                <>
                  <tr className='text-center hover:border-cyan-600 hover:border' data-idx={idx} key={idx}>
                    <td data-type='check' data-idx={idx}>
                      {
                        metaChecked.includes(idx)
                          ? <MdCheckBox className='inline' />
                          : <MdCheckBoxOutlineBlank className='inline' />
                      }
                    </td>
                    <td className='overflow-scroll truncate' data-type='extend' >{a.name}</td>
                    <td className='overflow-scroll truncate' data-type='extend' >{a.url}</td>
                    <td className='overflow-scroll sticky bg-black right-0' data-type='opt'>
                      <button >
                        <SlOptionsVertical className='inline'/>
                      </button>
                    </td>
                  </tr>

                  {/* META OTHER TABLE */}
                  <tr className="text-left w-auto h-full overflow-hidden hidden ">
                      <table className={` border-cyan-600 border-y text-[0.7rem] opacity-95`}>
                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2 w-4">URL:</th>
                          <td className="px-2">{a.url}</td>
                        </tr>

                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2 w-4">params:</th>
                          <td className="px-2"></td>
                        </tr>

                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2 w-4">Name:</th>
                          <td className="px-2">{a.name}</td>
                        </tr>

                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2 w-4">Accounts:</th>
                          <td className="px-2">
                            <table>
                              <thead className='sticky top-0 bg-black'>
                                <tr>
                                  <th className='px-2'> Account Used </th>
                                  <th className='px-2'> Min Employee Range </th>
                                  <th className='px-2'> Max Employee Range </th>
                                </tr>
                              </thead>
                              <tbody className="text-[0.5rem] text-center">
                                {
                                  a.accounts?.length && a.accounts.map((a0, idx) => (
                                    <tr key={idx} className="hover:border-cyan-600 hover:border-y">
                                      <td className="px-2">{ appState$.accounts.peek().find(a1 => a1._id === a0.accountID)?.domainEmail }</td>
                                      <td className="px-2">{a0.range[0]}</td>
                                      <td className="px-2">{a0.range[1]}</td>
                                    </tr>
                                  ))
                                }
                              </tbody>
                            </table>
                          </td>
                        </tr>

                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2 w-4">Scrapes:</th>
                          <td className="px-2">
                            <table>
                              <thead className='sticky top-0 bg-black'>
                                <tr>
                                  <th className='px-2'> Length </th>
                                  <th className='px-2'> Date </th>
                                </tr>
                              </thead>
                              <tbody className="text-[0.5rem] text-center">
                                {
                                  a.scrapes?.length && a.scrapes.map((a0, idx) => (
                                    <tr key={idx} className="hover:border-cyan-600 hover:border-y">
                                      <td className="px-2">{a0.length}</td>
                                      <td className="px-2">{fmtDate(a0.date)}</td>
                                    </tr>
                                  ))
                                }
                                <td className='overflow-scroll bg-cyan-500/90 font-bold border-t-2' >
                                    {
                                      a.scrapes.reduce((acc, cur) => {
                                        const o = (typeof cur.length !== 'number') ? 0 : cur.length
                                        return acc + o
                                      }, 0)
                                    }
                                  </td>
                                  <div className="bg-cyan-500/90 font-bold border-t-2">TOTAL LEADS SCRAPED</div>
                              </tbody>
                            </table>
                          </td>
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
  </>
  )
}


export const Record = ({records, meta, metaChecked}: RecordsSubCompArgs) => {
  const handleExtendRow = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    //@ts-ignore
    const type = e.target.closest('td')?.dataset.type as string

    switch (type) {
      case 'link':
        break;
      case 'opt':
        //@ts-ignore
        console.log(e.target.closest('tr').dataset.idx)
        break;
      case 'extend':
        //@ts-ignore
        e.target.closest('tr').nextSibling.classList.toggle('hidden')
        //@ts-ignore
        e.target.closest('tr').nextSibling.firstElementChild?.classList.toggle('hidden')
        break;
    }
  }


  const recordFilter = () => {
    const filter: string[] = []
    metaChecked.forEach( m => {
      meta[m].scrapes.forEach(d => filter.push(d.scrapeID))
    })

    return filter.length
      ? records.filter((r) => filter.includes(r.scrapeID))
      : []
  }

  return (
    <div className='border-cyan-600 border rounded grow overflow-auto'>
    <table className=" w-[150%] font-light text-left table-fixed border-spacing-x-2 border-collapse">
      <thead className='top-0 bg-black text-sm z-50'>
        <tr>
          <th className="px-2 sticky left-0 bg-black">Name</th>
          <th className="px-2">Title</th>
          <th className="px-2">Company</th>
          <th className="px-2">Email</th>
          <th className="px-2">Location</th>
          <th className="px-2"># Employees</th>
          <th className="px-2">Phone</th>
          <th className="px-2">Industry</th>
          <th className="px-2">Keywords</th>
        </tr>
      </thead>
      <tbody className="relative" onClick={handleExtendRow}>
        {
          records.length && recordFilter().map( 
            (a, idx) => ( 
              <>
                <tr className='text-[0.8rem] border border-cyan-600 border-opacity-30'  data-idx={idx} key={idx}>
                  
                  <td className='py-3 px-2 border-opacity-30 border border-cyan-600 bg-black sticky left-0  truncate' data-type='extend'>
                    <div className='mb-2 truncate'>{a.data.Name}</div>
                    <div><a href={a.data.Linkedin} data-type='link'></a><FaLinkedinIn /></div>
                  </td>

                  <td className='py-3 px-2 truncate' data-type='extend'>{a.data.Title}</td>

                  <td className='py-3 px-2 overflow-hidden w-full max-w-full min-w-full' data-type='extend'>
                    <div className='mb-2 truncate'>{a.data["Company Name"]}</div>
                    <div className="flex gap-3">
                      {a.data["Company Website"] && <span><BiLinkAlt /></span>}
                      {a.data["Company Linkedin"] && <span><FaLinkedinIn /></span>}
                      {a.data["Company Twitter"] && <span><FaTwitter /></span>}
                      {a.data["Company Facebook"] && <span><FaFacebookF /></span>}
                    </div>
                  </td>

                  <td className='py-3 px-2 truncate' data-type='extend'>{a.data.Email}</td>
                  
                  <td className='py-3 px-2 truncate' data-type='extend'>{ a.data['Company Location'] }</td>
                  
                  <td className='py-3 px-2 truncate' data-type='extend'>{a.data.Employees}</td>
                  
                  <td className='py-3 px-2 truncate' data-type='extend'>{a.data.Phone}</td>
                  
                  <td className='py-3 px-2 truncate' data-type='extend'>{a.data.Industry}</td>
                  
                  <td className='py-3 px-2 truncate' data-type='extend'>{a.data.Keywords}</td>

                </tr>

                <tr className="hidden">
                  <table className="hidden border-cyan-600 border-y">
                    <tr className="hover:border-cyan-600 hover:border-y">
                      <th className="whitespace-nowrap px-2">Name:</th>
                      <td className="px-2">{a.data.Name}</td>
                    </tr>
                    <tr className="hover:border-cyan-600 hover:border-y">
                      <th className="whitespace-nowrap px-2">Linkedin:</th>
                      <td className="px-2">{a.data.Linkedin}</td>
                    </tr>
                    <tr className="hover:border-cyan-600 hover:border-y">
                      <th className="whitespace-nowrap px-2">Title:</th>
                      <td className="px-2">{a.data.Title}</td>
                    </tr>
                    <tr className="hover:border-cyan-600 hover:border-y">
                      <th className="whitespace-nowrap px-2">Company Name:</th>
                      <td className="px-2">{a.data['Company Name']}</td>
                    </tr>
                    <tr className="hover:border-cyan-600 hover:border-y">
                      <th className="whitespace-nowrap px-2">Company Website:</th>
                      <td className="px-2">{a.data['Company Website']}</td>
                    </tr>
                    <tr className="hover:border-cyan-600 hover:border-y">
                      <th className="whitespace-nowrap px-2">Company Linkedin:</th>
                      <td className="px-2">{a.data['Company Linkedin']}</td>
                    </tr>
                    <tr className="hover:border-cyan-600 hover:border-y">
                      <th className="whitespace-nowrap px-2">Company Twitter:</th>
                      <td className="px-2">{a.data['Company Twitter']}</td>
                    </tr>
                    <tr className="hover:border-cyan-600 hover:border-y">
                      <th className="whitespace-nowrap px-2">Company Facebook:</th>
                      <td className="px-2">{a.data['Company Facebook']}</td>
                    </tr>
                    <tr className="hover:border-cyan-600 hover:border-y">
                      <th className="whitespace-nowrap px-2">Email:</th>
                      <td className="px-2">{a.data.Email}</td>
                    </tr>
                    <tr className="hover:border-cyan-600 hover:border-y">
                      <th className="whitespace-nowrap px-2">Location:</th>
                      <td className="px-2">{a.data['Company Location']}</td>
                    </tr>
                    <tr className="hover:border-cyan-600 hover:border-y">
                      <th className="whitespace-nowrap px-2">Employees:</th>
                      <td className="px-2">{a.data.Employees}</td>
                    </tr>
                    <tr className="hover:border-cyan-600 hover:border-y">
                      <th className="whitespace-nowrap px-2">Phone:</th>
                      <td className="px-2">{a.data.Phone}</td>
                    </tr>
                    <tr className="hover:border-cyan-600 hover:border-y">
                      <th className="whitespace-nowrap px-2">Industry:</th>
                      <td className="px-2">{a.data.Industry}</td>
                    </tr>
                    <tr className="hover:border-cyan-600 hover:border-y">
                      <th className="whitespace-nowrap px-2">Keywords:</th>
                      <td className="px-2">{a.data.Keywords}</td>
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
  )
}