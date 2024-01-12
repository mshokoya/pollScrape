import { MouseEvent, useEffect, useState } from "react"
import {fetchData} from '../core/util';
import { SlOptionsVertical } from "react-icons/sl";
import { IoOptionsOutline } from "react-icons/io5";

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
    {_id: '12345', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '54343', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '64536', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '64522', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '47657', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '83756', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '59878', scrapeID: 'd', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '34525', scrapeID: 'p', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '06890', scrapeID: 'p', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '24565', scrapeID: 'p', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '25464', scrapeID: 'p', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '65434', scrapeID: 'p', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '89758', scrapeID: 'c', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '35445', scrapeID: 'c', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '65423', scrapeID: 'c', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '45237', scrapeID: 'c', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '98677', scrapeID: 'e', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '09780', scrapeID: 'e', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '12346', scrapeID: 'e', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '56465', scrapeID: 'r', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '18735', scrapeID: 'r', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '65445', scrapeID: 'r', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '15466', scrapeID: 't', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '75466', scrapeID: 't', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '09876', scrapeID: 'y', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '12eef', scrapeID: 'e', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '5342r', scrapeID: 'r', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '17564', scrapeID: 'r', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '58768', scrapeID: 'r', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '65456', scrapeID: 't', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: '987yh', scrapeID: 't', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
    {_id: 'tyr65', scrapeID: 'y', url: 'http:/dsadsa.com', page: 1, data: {name: 'mike', linkedin: 'fsd', title: 'fdsfds', companyName: "fdsw", companyURL: 'dsfw', comapnyLinkedin: 'thre', companyTwitter: 'grev', companyFacebook: 'tgerf', email: 'dfsfew', isVerified: true, location: 'cvfgd', employees: 'ds', phone: '324532', industry: 'fsdgre', keywords: ['fdssf', 'fdse']}},
  ]);

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
    <div className="flex relative grow">
    <div className="flex flex-col grow absolute inset-x-0 inset-y-0">
      <div className=' border-cyan-600 border rounded h-[25%] mb-6 overflow-auto'>
        <table className="text-[0.7rem] m-auto w-full table-fixed">
          <thead className='sticky top-0 bg-black'>
            <tr>
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

      <div className='border-cyan-600 border rounded grow overflow-auto'>
        <table className="text-[0.7rem] m-auto w-full table-fixed">
          <thead className='sticky top-0 bg-black'>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Title</th>
              <th className='w-[10%]'><IoOptionsOutline className='inline' /></th>
            </tr>
          </thead>
          <tbody className="text-[0.5rem] relative" onClick={handleExtendRow}>
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
    </div>
  )
}