import { useEffect, useState } from "react"
import {fetchData} from '../core/util';

export const RecordField = ({recordList}: {recordList: string[]}) => {
  const [selected, setSelected] = useState(0);
  const [meta, setMeta] = useState([]);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    
    new Promise(async (resolve, reject) => {
      const meta = await fetchData('/metadata', 'GET');
      const records = await fetchData('/records', 'GET');
      resolve({meta, records})
    })
    .then( (data: any) => {
      setMeta(data.meta)
      setRecords(data.records)
    })
    .catch( (err: any) => {
      console.log('error')
      console.log(err.message)
    })

  }, [])

  return (
    <div className="flex flex-col grow">
      <div className=' border-cyan-600 border rounded h-[25%] mb-6'>
        <ul>
          {
            recordList && recordList.map(p => ( <div>{p}</div>))
          }
        </ul>
      </div>
      <div className='border-cyan-600 border rounded grow'>
        <ul>
          {
            recordList && recordList.map(p => ( <div>{p}</div>))
          }
        </ul>
      </div>
    </div>
  )
}