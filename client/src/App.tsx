import './App.css'
import {useState, FormEvent} from 'react';
import {fetchData} from './core/util';

function App() {
  const [accounts, setAccounts] = useState([]);
  const [proxies, setProxies] = useState([]);
  const [scrapeData, setScrapeData] = useState([]);

  const [proxy, setProxy] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [scrapeURL, setScrapeURL] = useState('');



  const handleStartScrape = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = await fetchData('/startscrape', 'POST', {url: scrapeURL})
    setScrapeData(data)
  }

  const handleSubmitProxy = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = await fetchData('/addproxy', 'POST', {proxy})
    setProxies(data)
  }

  const handleUploadAccount = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = await fetchData('/addaccount', 'POST', {email, password})
    setAccounts(data)
  }

  return (
    <>
      {/* <div className='mb-4'>
        <button onClick={handleStartScrape}> start scrape</button>
      </div> */}
      <div className='mb-4'>
        <form onSubmit={handleStartScrape}>
          <div>
            <label htmlFor="startScrape">URL:</label>
            <input type="text" id="startScrape" value={scrapeURL} onChange={(e) => {setScrapeURL(e.currentTarget.value)}}/>
          </div>
          
          <input type="submit" value="Start Scraping"/>
        </form>
      </div>

      <div className='mb-4'>
        <form onSubmit={handleSubmitProxy}>
          <div>
            <label htmlFor="proxy">Proxy:</label>
            <input type="text" id="proxy" value={proxy} onChange={(e) => {setProxy(e.currentTarget.value)}}/>
          </div>
          
          <input type="submit" value="Add Proxy"/>
        </form>
      </div>

      <div className='mb-10'>
        <form onSubmit={handleUploadAccount}>
          <div>
            <label htmlFor="email">Upload Account:</label>
            <input type="text" id="email" placeholder='email' value={email} onChange={(e) => {setEmail(e.target.value)}}/>
          </div>
          <div>
            <label htmlFor="password">Upload Account:</label>
            <input type="text" id="password" placeholder='password' value={password} onChange={(e) => {setPassword(e.target.value)}}/>
          </div>
  
          <input type="submit" value="Add Account"/>
        </form>
      </div>

      <div>
        <div>
          <div>Accounts</div>
          {JSON.stringify(accounts)}
        </div>

        <div>
          <div>proxies</div>
          {JSON.stringify(proxies)}
        </div>

        <div>
          <div>scraped data</div>
          {JSON.stringify(scrapeData)}
        </div>
      </div>
    </>
  )
}

export default App
