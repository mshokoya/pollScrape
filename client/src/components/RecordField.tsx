import { Dispatch, MouseEvent, SetStateAction, useEffect, useState } from "react"
import {fetchData} from '../core/util';
import { SlOptionsVertical } from "react-icons/sl";
import { IoOptionsOutline } from "react-icons/io5";
import { MdCheckBoxOutlineBlank } from "react-icons/md";
import { MdCheckBox } from "react-icons/md";
import { FaLinkedinIn } from "react-icons/fa";
import { BiLinkAlt } from "react-icons/bi";
import { FaTwitter } from "react-icons/fa";
import { FaFacebookF } from "react-icons/fa";
import LinesEllipsis from 'react-lines-ellipsis'

export type IMetaData = {
  _id: string
  url: string
  params: {[key: string]: string}
  fullURL: string
  name: string
  maxPages: number
  page: number
  scrapes: {page: number, scrapeID: string}[]
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
  Location: string
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
  const [meta, setMeta] = useState<IMetaData[]>([
    {_id: '12345', url: "www.gom", params: {lol: 'fds', poll: 'cascas'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes: [{page:1, scrapeID: 'd'}]},
    {_id: '12345', url: "www.gom", params: {lol: 'cvxxc', poll: 'nhg'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes:[{page:2, scrapeID: 'd'}]},
    {_id: '12345', url: "www.gom", params: {lol: 'cxzc', poll: 'cascas'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes: [{page:3, scrapeID: 'd'}]},
    {_id: '12345', url: "www.gom", params: {lol: 'scxz', poll: 'ghf'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes: [{page:4, scrapeID: 'd'}]},
    {_id: '12345', url: "www.gom", params: {lol: 'dasdsad', poll: 'cascas'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes:[{page:5, scrapeID: 'd'}]},
    {_id: '12345', url: "www.gom", params: {lol: 'dscsc', poll: 'vcfg'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes: [{page:1, scrapeID: 'p'}]},
    {_id: '12345', url: "www.gom", params: {lol: 'dsada', poll: 'cascas'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes: [{page:2, scrapeID: 'p'}]},
    {_id: '12345', url: "www.gom", params: {lol: 'dasdsad', poll: 'ythgf'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes:[{page:3, scrapeID: 'p'}]},
    {_id: '12345', url: "www.gom", params: {lol: 'dsadas', poll: 'jmhg'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes: [{page:4, scrapeID: 'p'}]},
    {_id: '12345', url: "www.gom", params: {lol: 'cxzcxz', poll: 'cascas'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes: [{page:5, scrapeID: 'p'}]},
    {_id: '12345', url: "www.gom", params: {lol: 'dasdsad', poll: 'xcvdf'}, fullURL: 'dsadsa', name: 'dad', maxPages: 4, page: 1, scrapes:[{page:1, scrapeID: 'c'}]},
    {_id: '12345', url: "www.gom", params: {lol: 'vsdsc', poll: 'dsvf'}, fullURL: 'dsadsa', name: 'dad', maxPages: 4, page: 1, scrapes: [{page:2, scrapeID: 'c'}]},
    {_id: '12345', url: "www.gom", params: {lol: 'dasdsad', poll: 'vcxfr'}, fullURL: 'dsadsa', name: 'dad', maxPages: 4, page: 1, scrapes: [{page:3, scrapeID: 'c'}]},
    {_id: '12345', url: "www.gom", params: {lol: 'hnfgbd', poll: 'kuyh'}, fullURL: 'dsadsa', name: 'dad', maxPages: 4, page: 1, scrapes:[{page:4, scrapeID: 'c'}]},
    {_id: '12345', url: "www.gom", params: {lol: 'jmthgfd', poll: 'hntg'}, fullURL: 'dsadsa', name: 'dad', maxPages: 1, page: 1, scrapes: [{page:1, scrapeID: 'e'}]},
    {_id: '12345', url: "www.gom", params: {lol: 'dasdsad', poll: 'cascas'}, fullURL: 'dsadsa', name: 'dad', maxPages: 1, page: 1, scrapes: [{page:1, scrapeID: 'r'}]},
    {_id: '12345', url: "www.gom", params: {lol: 'hyrtfg', poll: 'fdre'}, fullURL: 'dsadsa', name: 'dad', maxPages: 1, page: 1, scrapes:[{page:1, scrapeID: 't'}]},
    {_id: '12345', url: "www.gom", params: {lol: 'vfd', poll: 'dfer'}, fullURL: 'dsadsa', name: 'dad', maxPages: 1, page: 1, scrapes: [{page:1, scrapeID: 'y'}]},
  ]);
  const [records, setRecords] = useState<IRecords[]>([
    {_id: '12345', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsjhbknlmjhjgvhjbknhjghjkbnhbjgkw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '54343', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '64536', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '64522', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '47657', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '83756', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '59878', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '34525', scrapeID: 'p', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '06890', scrapeID: 'p', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '24565', scrapeID: 'p', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '25464', scrapeID: 'p', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '65434', scrapeID: 'p', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '89758', scrapeID: 'c', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '35445', scrapeID: 'c', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '65423', scrapeID: 'c', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '45237', scrapeID: 'c', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '98677', scrapeID: 'e', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '09780', scrapeID: 'e', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '12346', scrapeID: 'e', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '56465', scrapeID: 'r', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '18735', scrapeID: 'r', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '65445', scrapeID: 'r', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '15466', scrapeID: 't', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '75466', scrapeID: 't', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '09876', scrapeID: 'y', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '12eef', scrapeID: 'e', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '5342r', scrapeID: 'r', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '17564', scrapeID: 'r', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '58768', scrapeID: 'r', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '65456', scrapeID: 't', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: '987yh', scrapeID: 't', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
    {_id: 'tyr65', scrapeID: 'y', url: 'http:/dsadsa.com', page: 1, data: {Name: 'mike', Linkedin: 'fsd', Title: 'fdsfds', "Company Name": "fdsw", "Company Website": 'dsfw', "Company Linkedin": 'thre', "Company Twitter": 'grev', "Company Facebook": 'tgerf', Email: 'dfsfew', isVerified: true, Location: 'cvfgd', Employees: '8', Phone: '324532', Industry: 'fsdgre', Keywords: ['fdssf', 'fdse']}},
  ]);

  // useEffect(() => {
  //   // eslint-disable-next-line no-async-promise-executor
  //   new Promise(async (resolve) => {
  //     const meta = await fetchData('/metadata', 'GET');
  //     const records = await fetchData('/records', 'GET');
  //     resolve({meta, records})
  //   })
  //   .then( (data: any) => {
  //     console.log(data.meta.data)
  //     setMeta(data.meta.data)
  //     setRecords(data.records.data)
  //   })
  //   .catch( (err: any) => {
  //     console.log('error')
  //     console.log(err.message)
  //   })
  // }, [])


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
  const handleExtendRow = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    //@ts-ignore
    const type = e.target.closest('td')?.dataset.type as string

    switch (type) {
      case 'opt':
        //@ts-ignore
        console.log(e.target.closest('tr').dataset.idx)
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
        e.target.closest('tr').nextSibling?.firstElementChild?.classList.toggle('hidden')
        break;
    }
  }

  const handleMetaToggle = () => {
    metaChecked.length === meta.length
      ? setMetaChecked([])
      : setMetaChecked(meta.map((_, idx) => idx))
  }

  return (
    <div className=' border-cyan-600 min-w-[30%] max-w-[30%] border rounded overflow-auto'>
    <table className="text-[0.7rem] m-auto w-full table-fixed">
      <thead className='sticky top-0 bg-black'>
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
          <th>MaxPages</th>
          <th className='w-[7%]'><IoOptionsOutline className='inline' /></th>
        </tr>
      </thead>
      <tbody className="text-[0.5rem]" onClick={handleExtendRow}>
      {
            meta.length && meta.map( 
              (a, idx) => ( 
                <>
                  <tr className='text-center hover:border-cyan-600 hover:border'  data-idx={idx} key={idx}>
                    <td data-type='check' data-idx={idx}>
                      {
                        metaChecked.includes(idx)
                          ? <MdCheckBox className='inline' />
                          : <MdCheckBoxOutlineBlank className='inline' />
                      }
                    </td>
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
  )
}






export const Record = ({records, meta, metaChecked}: RecordsSubCompArgs) => {
  const handleExtendRow = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    //@ts-ignore
    const type = e.target.closest('td')?.dataset.type as string

    switch (type) {
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
      <thead className='sticky top-0 bg-black text-sm z-50'>
        <tr>
          <th className="px-2 sticky left-0 bg-black">Name</th>
          <th className="px-2">Title</th>
          <th className="px-2">Company</th>
          <th className="px-2">Email</th>
          <th className="px-2">Contact Location</th>
          <th className="px-2"># Employees</th>
          <th className="px-2">Phone</th>
          <th className="px-2">Industry</th>
          <th className="px-2">Keywords</th>
          <th className='px-2 w-[2%]'><IoOptionsOutline className='inline' /></th>
        </tr>
      </thead>
      <tbody className="relative" onClick={handleExtendRow}>
        {
          records.length && recordFilter().map( 
            (a, idx) => ( 
              <>
                <tr className='text-[0.8rem] h-[3rem] border border-cyan-600 border-opacity-30'  data-idx={idx} key={idx}>
                  
                  <td className='py-3 px-2 border-opacity-30 border border-cyan-600 bg-black sticky left-0  truncate' data-type='extend'>
                    <div className='mb-2 truncate'>{a.data.Name}</div>
                    <div><FaLinkedinIn /></div>
                  </td>

                  <td className='py-3 px-2 truncate' data-type='extend'>{a.data.Title}</td>

                  <td className='py-3 px-2 overflow-hidden w-full max-w-full min-w-full' data-type='extend'>
                    <div className='mb-2 truncate'>{a.data["Company Name"]}</div>
                    <div className="flex gap-3">
                      {a.data["Company Website"] && <span><a href={a.data["Company Website"]}><BiLinkAlt /></a></span>}
                      {a.data["Company Linkedin"] && <span><a href={a.data["Company Linkedin"]}><FaLinkedinIn /></a></span>}
                      {a.data["Company Twitter"] && <span><a href={a.data["Company Twitter"]}><FaTwitter /></a></span>}
                      {a.data["Company Facebook"] && <span><a href={a.data["Company Facebook"]}><FaFacebookF /></a></span>}
                    </div>
                  </td>

                  <td className='py-3 px-2 truncate' data-type='extend'>{a.data.Email}</td>
                  
                  <td className='py-3 px-2 truncate' data-type='extend'>{a.data.Location}</td>
                  
                  <td className='py-3 px-2 truncate' data-type='extend'>{a.data.Employees}</td>
                  
                  <td className='py-3 px-2 truncate' data-type='extend'>{a.data.Phone}</td>
                  
                  <td className='py-3 px-2 truncate' data-type='extend'>{a.data.Industry}</td>
                  
                  <td className='py-3 px-2 truncate' data-type='extend'>{a.data.Keywords}</td>
                  
                  <td className='py-3 px-2 truncate' data-type='opt'>
                    <button >
                      <SlOptionsVertical className='inline'/>
                    </button> 
                  </td>

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
                      <td className="px-2">{a.data.Location}</td>
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