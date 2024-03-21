import { ChangeEvent, FormEvent, useState } from "react"
import {fetchData, getRangeFromApolloURL, setRangeInApolloURL} from '../core/util';
import { batch } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";

type State = {
  url: string
  min?: number,
  max?: number
}

export const ScrapeField = () => {
  const [reqInProcess, setreqInProcess] = useState<boolean>(false)
  const s = useObservable<State>({
    url: '',
    min: undefined,
    max: undefined
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setreqInProcess(true)

    await fetchData('/scrape', 'POST', {url: s.url.peek(), usingProxy: false})
      .then( (d) => {
        console.log(d)
        setreqInProcess(false)
      })
      .catch((err) => {
        console.error(err)
        setreqInProcess(false)
      })
  }

  const handleInput = (urll: string) => {
    console.log('a hit')
    const range = getRangeFromApolloURL(urll)
    const min = !range[0] ? 1 : range[0]
    const max = !range[1] ? 10000000 : range[1]
    const url = setRangeInApolloURL(urll,[min, max])
    batch(() => {
      s.min.set(min)
      s.max.set(max)
      s.url.set(url)
    })
  }

  const handleRange = (val: number, rng: 'min' | 'max') => {
    const min = rng === 'min' 
      ? Number.isNaN(val)
        ? 1
        : val
      : s.min.get()
    const max = rng === 'max' 
    ? Number.isNaN(val)
      ? 10000000
      : val
    : s.max.get()
    const url = setRangeInApolloURL(s.url.get(),[min, max])
    batch(() => {
      s.url.set(url)
      rng === 'min'
        ? s.min.set(val)
        : s.max.set(val)
    })
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <div className='mb-3 flex'>
        <div className='mb-3 text-left'>
          <div className='mb-3'>
            <label className='mr-2' htmlFor="startScrape">URL: </label>
            <input required type="text" id="startScrape" value={s.url.get()} onChange={(e) => {handleInput(e.target.value)}}/>
          </div>
          
          <div className='mb-3'>
            <label className='mr-2' htmlFor="scrapeFrom">Min: </label>
            <input required id='scrapeFrom' type="number" min='1'  value={s.min.get()} onChange={(e) => {handleRange(e.target.value, 'min')} }/>
          </div>
          
          <div className='mb-3'>
            <label className='mr-2' htmlFor="scrapeTo">Max: </label>
            <input required id='scrapeTo' className='mr-2' type="number" min='1' value={s.max.get()} onChange={(e) => {handleRange(e.target.value, 'max')} }/>
          </div>
          

          <input disabled={reqInProcess} className='text-cyan-600 border-cyan-600 border rounded p-1 disabled:border-neutral-500 disabled:text-neutral-500' type="submit" value="Start Scraping"/>
        </div>

        <div className='mb-3'>
          <div> ----- </div>
          
        </div>
      </div>
    </form>
  )
}