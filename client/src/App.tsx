import './App.css'
import {useState} from 'react';

function App() {
  const [accounts, setAccounts] = useState([]);
  const [proxies, setProxies] = useState([]);
  const [scrapeData, setScrapeData] = useState([]);

  const [proxy, setProxy] = useState([]);

  const [email, setEmail] = useState([]);
  const [password, setPassword] = useState([]);



  const handleStartScrape = async () => {
    const data = await fetchData('localhost:3000/startscrape', 'GET')
    setScrapeData(data)
  }

  const handleSubmitProxy = async () => {
    const data = await fetchData('localhost:3000/proxy', 'POST')
    setProxies(data)
  }

  const handleUploadAccount = async () => {
    const data = await fetchData('localhost:3000/account', 'POST')
    setAccounts(data)
  }

  return (
    <>
      <div>
        <button onClick={handleStartScrape}> start scrape</button>
      </div>

      <div>
        <form onSubmit={handleSubmitProxy}>
          <label htmlFor="proxy">Proxy:</label>
          <input type="text" id="proxy" value={proxy} onChange={(e) => {setProxy(e.target.value)}}/>
          <input type="submit">Upload Proxy</input>
        </form>
      </div>

      <div>
        <form onSubmit={handleUploadAccount}>
          <label htmlFor="email">Upload Account:</label>
          <input type="text" id="email" placeholder='email' value={email} onChange={(e) => {setEmail(e.target.value)}}/>

          <label htmlFor="password">Upload Account:</label>
          <input type="text" id="password" placeholder='password' value={password} onChange={(e) => {setPassword(e.target.value)}}/>

          <input type="submit">Upload Account</input>
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

async function fetchData(url: string, method: string){
  const res = await fetch(url, {
    method,
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  return await res.json()
}

export default App
