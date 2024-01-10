import { useEffect, useState } from "react"
import {fetchData} from '../core/util';

export const RecordField = ({recordList}: {recordList: string[]}) => {
  const [selected, setSelected] = useState(0);
  const [meta, setMeta] = useState([]);
  const [records, setRecord] = useState([]);

  useEffect(() => {
    fetchData('/records', 'GET')
      .then(() => {
        
      })

  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await fetchData('/addaccount', 'POST', input)
  }

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