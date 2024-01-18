import { Dispatch, MouseEvent, SetStateAction, useEffect, useState } from "react"
import {fetchData} from '../core/util';
import { SlOptionsVertical } from "react-icons/sl";
import { IoOptionsOutline } from "react-icons/io5";
import { MdCheckBoxOutlineBlank } from "react-icons/md";
import { MdCheckBox } from "react-icons/md";

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
  'Comapny Linkedin': string
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
    // {_id: '12345', url: "www.gom", params: {lol: 'fds', poll: 'cascas'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes: [{page:1, scrapeID: 'd'}]},
    // {_id: '12345', url: "www.gom", params: {lol: 'cvxxc', poll: 'nhg'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes:[{page:2, scrapeID: 'd'}]},
    // {_id: '12345', url: "www.gom", params: {lol: 'cxzc', poll: 'cascas'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes: [{page:3, scrapeID: 'd'}]},
    // {_id: '12345', url: "www.gom", params: {lol: 'scxz', poll: 'ghf'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes: [{page:4, scrapeID: 'd'}]},
    // {_id: '12345', url: "www.gom", params: {lol: 'dasdsad', poll: 'cascas'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes:[{page:5, scrapeID: 'd'}]},
    // {_id: '12345', url: "www.gom", params: {lol: 'dscsc', poll: 'vcfg'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes: [{page:1, scrapeID: 'p'}]},
    // {_id: '12345', url: "www.gom", params: {lol: 'dsada', poll: 'cascas'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes: [{page:2, scrapeID: 'p'}]},
    // {_id: '12345', url: "www.gom", params: {lol: 'dasdsad', poll: 'ythgf'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes:[{page:3, scrapeID: 'p'}]},
    // {_id: '12345', url: "www.gom", params: {lol: 'dsadas', poll: 'jmhg'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes: [{page:4, scrapeID: 'p'}]},
    // {_id: '12345', url: "www.gom", params: {lol: 'cxzcxz', poll: 'cascas'}, fullURL: 'dsadsa', name: 'dad', maxPages: 5, page: 1, scrapes: [{page:5, scrapeID: 'p'}]},
    // {_id: '12345', url: "www.gom", params: {lol: 'dasdsad', poll: 'xcvdf'}, fullURL: 'dsadsa', name: 'dad', maxPages: 4, page: 1, scrapes:[{page:1, scrapeID: 'c'}]},
    // {_id: '12345', url: "www.gom", params: {lol: 'vsdsc', poll: 'dsvf'}, fullURL: 'dsadsa', name: 'dad', maxPages: 4, page: 1, scrapes: [{page:2, scrapeID: 'c'}]},
    // {_id: '12345', url: "www.gom", params: {lol: 'dasdsad', poll: 'vcxfr'}, fullURL: 'dsadsa', name: 'dad', maxPages: 4, page: 1, scrapes: [{page:3, scrapeID: 'c'}]},
    // {_id: '12345', url: "www.gom", params: {lol: 'hnfgbd', poll: 'kuyh'}, fullURL: 'dsadsa', name: 'dad', maxPages: 4, page: 1, scrapes:[{page:4, scrapeID: 'c'}]},
    // {_id: '12345', url: "www.gom", params: {lol: 'jmthgfd', poll: 'hntg'}, fullURL: 'dsadsa', name: 'dad', maxPages: 1, page: 1, scrapes: [{page:1, scrapeID: 'e'}]},
    // {_id: '12345', url: "www.gom", params: {lol: 'dasdsad', poll: 'cascas'}, fullURL: 'dsadsa', name: 'dad', maxPages: 1, page: 1, scrapes: [{page:1, scrapeID: 'r'}]},
    // {_id: '12345', url: "www.gom", params: {lol: 'hyrtfg', poll: 'fdre'}, fullURL: 'dsadsa', name: 'dad', maxPages: 1, page: 1, scrapes:[{page:1, scrapeID: 't'}]},
    // {_id: '12345', url: "www.gom", params: {lol: 'vfd', poll: 'dfer'}, fullURL: 'dsadsa', name: 'dad', maxPages: 1, page: 1, scrapes: [{page:1, scrapeID: 'y'}]},
  ]);
  const [records, setRecords] = useState<IRecords[]>([
    // {_id: '12345', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '54343', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '64536', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '64522', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '47657', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '83756', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '59878', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '34525', scrapeID: 'p', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '06890', scrapeID: 'p', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '24565', scrapeID: 'p', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '25464', scrapeID: 'p', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '65434', scrapeID: 'p', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '89758', scrapeID: 'c', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '35445', scrapeID: 'c', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '65423', scrapeID: 'c', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '45237', scrapeID: 'c', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '98677', scrapeID: 'e', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '09780', scrapeID: 'e', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '12346', scrapeID: 'e', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '56465', scrapeID: 'r', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '18735', scrapeID: 'r', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '65445', scrapeID: 'r', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '15466', scrapeID: 't', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '75466', scrapeID: 't', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '09876', scrapeID: 'y', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '12eef', scrapeID: 'e', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '5342r', scrapeID: 'r', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '17564', scrapeID: 'r', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '58768', scrapeID: 'r', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '65456', scrapeID: 't', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: '987yh', scrapeID: 't', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    // {_id: 'tyr65', scrapeID: 'y', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
  ]);

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
      <div className="flex flex-col grow absolute inset-x-0 inset-y-0">
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
    <div className=' border-cyan-600 border rounded min-h-[25%] max-h-[25%] mb-6 overflow-auto'>
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
    <table className="text-[0.7rem] m-auto w-full table-fixed">
      <thead className='sticky top-0 bg-black'>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Title</th>
          <th className='w-[7%]'><IoOptionsOutline className='inline' /></th>
        </tr>
      </thead>
      <tbody className="text-[0.5rem] relative" onClick={handleExtendRow}>
        {
          records.length && recordFilter().map( 
            (a, idx) => ( 
              <>
                <tr className='text-center hover:border-cyan-600 hover:border'  data-idx={idx} key={idx}>
                  <td className='overflow-scroll' data-type='extend' >{a.data.Name}</td>
                  <td className='overflow-scroll' data-type='extend' >{a.data.Email}</td>
                  <td className='overflow-scroll' data-type='extend' >{a.data.Title}</td>
                  <td className='overflow-scroll' data-type='opt'>
                    <button >
                      <SlOptionsVertical className='inline'/>
                    </button>
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="hidden hover:border-cyan-600 hover:border">
                    <div>name: {a.data.Name}</div>
                    <div>linkedin: {a.data.Linkedin}</div>
                    <div>title: {a.data.Title}</div>
                    <div>company name: {a.data['Company Name']}</div>
                    <div>company url: {a.data['Company Website']}</div>
                    <div>company linkedin: {a.data['Comapny Linkedin']}</div>
                    <div>company twitter: {a.data['Company Twitter']}</div>
                    <div>company facebook: {a.data['Company Facebook']}</div>
                    <div>email: {a.data.Email}</div>
                    <div>isVerified: {a.data.isVerified}</div>
                    <div>location: {a.data.Location}</div>
                    <div>employees: {a.data.Employees}</div>
                    <div>phone: {a.data.Phone}</div>
                    <div>industry: {a.data.Industry}</div>
                    <div>keywords: {a.data.Keywords}</div>
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