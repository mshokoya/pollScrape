import { useEffect, useState } from "react"
import {fetchData} from '../core/util';
import { SlOptionsVertical } from "react-icons/sl";

export const RecordField = () => {
  const [meta, setMeta] = useState([]);
  const [records, setRecords] = useState([]);

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
          <tbody className="text-[0.5rem]">
            {
              meta.length && meta.map( 
                (a, idx) => ( 
                  <tr className='text-center' key={idx}>
                    <td className='overflow-scroll'>{a.name}</td>
                    <td className='overflow-scroll'>{a.url}</td>
                    <td className='overflow-scroll'>{a.maxPages}</td>
                  </tr>
                )
              )
            }
          </tbody>
        </table>
      </div>

      <div className=' border-cyan-600 border rounded grow overflow-scroll'>
        <table className="text-[0.7rem] m-auto w-full table-fixed">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Title</th>
              <th className='w-[10%]'><SlOptionsVertical className='inline'/></th>
            </tr>
          </thead>
          <tbody className="text-[0.5rem]">
            {
              records.length && records.map( 
                (p, idx) => ( 
                  <tr className='text-center' key={idx}>
                    <td className='overflow-scroll'>{p.data.name}</td>
                    <td className='overflow-scroll'>{p.data.email}</td>
                    <td className='overflow-scroll'>{p.data.title}</td>
                  </tr>
                )
              )
            }
          </tbody>
        </table>
      </div>

    </div>
  )
}