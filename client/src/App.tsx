import {useState, FormEvent} from 'react';
import {fetchData} from './core/util';
import { ProxyField } from './components/ProxyField';

function App() {
  const [URLInput, setURLInput] = useState('');
  const [scrapeType, setScrapeType] = useState('single')

  const handleStartScrape = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // const data = await fetchData('/startscrape', 'POST', {url: scrapeURL})
  }

  return (
    <div className='flex flex-col center'>
      {/* <div className='mb-4'>
        <button onClick={handleStartScrape}> start scrape</button>
      </div> */}
      
      <div className='mb-4 text-center'>
        <div>
          <h2 className='text-[2rem] mb-3'>Apollo URL To Scrape</h2>
          <form onSubmit={handleStartScrape}>
            <div className='mb-3'>
              <div className='mb-3'>
                <label className='mr-2' htmlFor="startScrape">URL: </label>
                <input className='mr-5' type="text" id="startScrape" value={URLInput} onChange={ e => {setURLInput(e.currentTarget.value)}}/>
              </div>
              
              <div className='mb-5'>
                <label className='mr-2' htmlFor="scrapeType">Scrape Type: </label>
                <select id="scrapeType" name="scrapeType" value={scrapeType} onChange={e => {setScrapeType(e.currentTarget.value)}}>
                  <option value="single">Scrape Single Page</option>
                  <option value="all">Scrape All Pages</option>
                  <option value="excessive">Excessive Scrape</option>
                </select>
              </div>
            
              <input className='text-cyan-600 border-cyan-600 border rounded p-1' type="submit" value="Start Scraping"/>
            </div>

          </form>
        </div>
      </div>
      

      <div className='flex justify-evenly'>
        {/* PROXIES */}
        
        <div className='mb-4'>
          <h2 className='text-[2rem] mb-3'>PROXIES</h2>
          <ProxyField proxyList={[]} />
        </div>

        {/* ACCOUNTS */}
        <div className='mb-10'>
          <h2 className='text-[2rem] mb-3'>ACCOUNTS</h2>
        </div>

        {/* RECORDS */}
        <div>
          <h2 className='text-[2rem] mb-3'>RECORDS</h2>
        </div>

      </div>

    </div>
  )
}

export default App