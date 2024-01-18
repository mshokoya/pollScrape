import { ChangeEvent, FormEvent, useState } from "react"
import {fetchData} from '../core/util';
import moment from "moment";

export const ScrapeField = () => {
  const [reqInProcess, setreqInProcess] = useState<boolean>(false)
  const [URLInput, setURLInput] = useState('');
  const [pages, setPages] = useState({start: 1, end: 1});
  const [delay, setDelay] = useState(1);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (pages.start > pages.end) {
      console.error("'Start' field should be less than or equal to the 'End' field")
      return;
    }

    if (pages.end < pages.start) {
      console.error(" 'End' field should be greater than or equal to the 'Start' field")
      return;
    }

    // setreqInProcess(true)

    // await fetchData('/scrape', 'POST', {url: URLInput, from: pages.start, to: pages.end,  usingProxy: false})
    //   .then( (d) => {
    //     console.log(d)
    //     setreqInProcess(false)
    //   })
    //   .catch((err) => {
    //     console.error(err)
    //     setreqInProcess(false)
    //   })
  }

  const handlePages = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value)

    if (e.target.dataset.start) {
      setPages({...pages, start: val})
    } else if (e.target.dataset.end) {
      setPages({...pages, end: val})
    } else if (e.target.dataset.delay) {
      const val = parseInt(e.target.value)

      val < 1 || e.target.value === ''
        ? setDelay(1)
        : setDelay(val)
    }
  }

  const secondsToTime = (e) => {
    let time = ''; 
    const h = Math.floor(e / 3600).toString().padStart(2,'0'),
          m = Math.floor(e % 3600 / 60).toString().padStart(2,'0'),
          s = Math.floor(e % 60).toString().padStart(2,'0');
    
    if (h !== '00') { time = time + h + ' hours ' }
    if (m !== '00') { time = time + m + ' minutes '}
    if (s !== '00') { time = time + s + ' seconds ' }

    return time
  }

  const numPagesScrape = () => {
    return pages.start === pages.end
      ? 1
      : pages.end - pages.start
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className='mb-3'>
        <div className='mb-3'>
          <label className='mr-2' htmlFor="startScrape">URL: </label>
          <input required type="text" id="startScrape" value={URLInput} onChange={ e => {setURLInput(e.currentTarget.value)}}/>
        </div>

        <div className='mb-3' onChange={handlePages}>
          <label className='mr-2' htmlFor="scrapeFrom">Start Page: </label>
          <input required id='scrapeFrom' className='mr-2' type="number" min='1' max='100' value={pages.start} data-start />

          <label className='mr-2' htmlFor="scrapeTo">End Page: </label>
          <input required id='scrapeTo' className='mr-2' type="number" min='1' max='100' value={pages.end} data-end />

          <label className='mr-2' htmlFor="delay">Delay: </label>
          <input required id='delay' className='mr-2' type='number' min='1' max='30' value={delay} data-delay />
        </div>


        <div className='mb-3'>
          <div>Estimated time</div>
          <div>
            <span className='text-red-700'>{secondsToTime(delay)}</span> lead enrichment delay
          </div>
          <div> 
            <span className='text-green-500'>{secondsToTime(delay * 25)}</span> to scrape one page
          </div>
          <div>
           <span className='text-pink-800'>{secondsToTime( (delay * 25) * numPagesScrape() )}</span> to scrape all pages
          </div>
        </div>
      
        <input disabled={reqInProcess} className='text-cyan-600 border-cyan-600 border rounded p-1 disabled:border-neutral-500 disabled:text-neutral-500' type="submit" value="Start Scraping"/>
      </div>
    </form>
  )
}