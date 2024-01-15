import { FormEvent, useState } from "react"
import {fetchData} from '../core/util';

export const ScrapeField = () => {
  const [reqInProcess, setreqInProcess] = useState<boolean>(false)
  const [URLInput, setURLInput] = useState('');
  const [scrapeType, setScrapeType] = useState('single')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setreqInProcess(true)

    await fetchData('/scrape', 'POST', {urls: [URLInput], usingProxy: false})
      .then( (d) => {
        console.log(d)
        setreqInProcess(false)
      })
      .catch((err) => {
        console.log(err)
        setreqInProcess(false)
      })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className='mb-3'>
        <div className='mb-3'>
          <label className='mr-2' htmlFor="startScrape">URL: </label>
          <input required type="text" id="startScrape" value={URLInput} onChange={ e => {setURLInput(e.currentTarget.value)}}/>
        </div>
        
        <div className='mb-3'>
          <label className='mr-2' htmlFor="scrapeType">Scrape Type: </label>
          <select id="scrapeType" name="scrapeType" value={scrapeType} onChange={e => {setScrapeType(e.currentTarget.value)}}>
            <option value="single">Scrape Single Page</option>
            <option value="all">Scrape All Pages</option>
            <option value="excessive">Excessive Scrape</option>
          </select>
        </div>
      
        <input disabled={reqInProcess} className='text-cyan-600 border-cyan-600 border rounded p-1 disabled:border-neutral-500 disabled:text-neutral-500' type="submit" value="Start Scraping"/>
      </div>
    </form>
  )
}