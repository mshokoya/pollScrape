import './App.css'
import {useState} from 'react';

function App() {
  const [accounts, setAccounts] = useState([]);
  const [proxies, setProxies] = useState([]);
  const [scrapeData, setScrapeData] = useState([]);

  const [proxy, setProxy] = useState([]);

  const [email, setEmail] = useState([]);
  const [password, setPassword] = useState([]);



  const handleStartScrape = () => {}

  const handleSubmitProxy = () => {}

  const handleUploadAccount = () => {}

  return (
    <>
      <div>
        <button onClick={handleStartScrape}> start scrape</button>
      </div>

      <div>
        <form onSubmit={handleSubmitProxy}>
          <label htmlFor="proxy">Proxy:</label>
          <input type="text" id="proxy" value={proxy} onChange={(e) => setProxy(e.target.value)}/>
          <input type="submit">Upload Proxy</input>
        </form>
      </div>

      <div>
        <form onSubmit={handleUploadAccount}>
          <label htmlFor="email">Upload Account:</label>
          <input type="text" id="email" placeholder='email' value={email} onChange={(e) => setEmail(e.target.value)}/>

          <label htmlFor="password">Upload Account:</label>
          <input type="text" id="password" placeholder='password' value={password} onChange={(e) => setPassword(e.target.value)}/>

          <input type="submit">Upload Account</input>
        </form>
      </div>

      <div>
        <div>
          <div>Accounts</div>
        </div>

        <div>
          <div>proxies</div>
        </div>

        <div>
          <div>scraped data</div>
        </div>
      </div>
    </>
  )
}

export default App
