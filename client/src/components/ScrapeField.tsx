import { FormEvent, MouseEvent} from "react"
import {chuckRange, fetchData, getEmailStatusFromApolloURL, getLeadColFromApolloURL, getRangeFromApolloURL, removeEmailStatusInApolloURL, removeLeadColInApolloURL, setEmailStatusInApolloURL, setLeadColInApolloURL, setRangeInApolloURL} from '../core/util';
import { batch, computed } from "@legendapp/state";
import { observer, useObservable } from "@legendapp/state/react";
import { selectAccForScrapingFILO } from "../core/state/account";
import { IoMdCloseCircle } from "react-icons/io";
import { ObservableComputed } from "@legendapp/state";


type State = {
  reqInProcess: boolean
  url: string
  min?: number
  max?: number
  checkedStatus: string[]
  leadCol: string,
  chunkParts: number
  aar: ObservableComputed<{
    chunk: [number, number][];
    accounts: string[];
}>
}



export const ScrapeField = observer(() => {
  const defaultState = {
    reqInProcess: false,
    url: '',
    min: undefined,
    max: undefined,
    checkedStatus: [],
    leadCol: 'total',
    chunkParts: 4,
    aar: computed(() => {
      const {min, max, chunkParts} = s.get()

      if (!min || !max || !chunkParts) return { chunk: [], accounts: []}
    
      const chunk = chuckRange(min, max, chunkParts)
      const accounts = selectAccForScrapingFILO(chunk.length)
  
      return { 
        chunk,
        accounts: accounts.map(a => a.domainEmail )
      }
    })
  }
  const s = useObservable<State>(defaultState);


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // s.reqInProcess.set(true)

    // await fetchData('/scrape', 'POST', {url: s.url.peek(), usingProxy: false})
    //   .then( (d) => {
    //     console.log(d)
    //   })
    //   .catch((err) => {
    //     console.error(err)
    //   })
    //   .finally(() => {
    //     s.reqInProcess.set(false)
    //   })
  }

  const handleInput = (urll: string) => {
    if (!urll.includes('https://app.apollo.io/#/people?finderViewId=')) {
      s.set(defaultState)
      return
    }
    const range = getRangeFromApolloURL(urll)
    const min = !range[0] ? 1 : range[0]
    const max = !range[1] ? 10000000 : range[1]
    const url = setRangeInApolloURL(urll,[min, max])
    const emailStatus = getEmailStatusFromApolloURL(url)
    let leadCol: string | null = getLeadColFromApolloURL(url)
    leadCol = !leadCol ? 'total': (leadCol === 'no') ? 'new' : null

    batch(() => {
      s.min.set(min)
      s.max.set(max)
      s.url.set(url)
      s.checkedStatus.set(emailStatus)
      if (!leadCol) {
        s.url.set(removeLeadColInApolloURL(url))
        s.leadCol.set('total')
      } else {
        s.leadCol.set(leadCol)
      }
    })
  }

  const handleRange = (val: number, rng: 'min' | 'max') => {
    if (!s.url.peek().includes('https://app.apollo.io/#/people?finderViewId=')) return
    
    const min = rng === 'min' 
      ? Number.isNaN(val)
        ? 1
        : val
      : s.min.peek()

    const max = rng === 'max' 
    ? Number.isNaN(val)
      ? 10000000
      : val
    : s.max.peek()
    
    const url = setRangeInApolloURL(s.url.peek(),[min, max])

    batch(() => {
      s.url.set(url)
      rng === 'min'
        ? s.min.set(val)
        : s.max.set(val)
    })
  }

  const handleEmailStatus = (e:  MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    if (!s.url.peek().includes('https://app.apollo.io/#/people?finderViewId=')) return
    
    // @ts-ignore
    const status = e.target.dataset.status as string
    const url = s.url.get()

    if (!status) return

    s.checkedStatus.get().includes(status)
      ? (
        batch(() => {
          const nURL = removeEmailStatusInApolloURL(url, status)
          s.url.set( nURL )
          if (!nURL.includes(`contactEmailStatus[]=${status}`)) s.checkedStatus.set( v => v.filter(v0 => v0 !== status) )
        })
      )
      : (
        batch(() => {
          const nURL = setEmailStatusInApolloURL(url, status)
          s.url.set( nURL )
          if (nURL.includes(`contactEmailStatus[]=${status}`)) s.checkedStatus.push(status)
          
        })
      )
  }

  const handleLeadCol = (e:  MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    if (!s.url.peek().includes('https://app.apollo.io/#/people?finderViewId=')) return
    
    // @ts-ignore
    const leadCol = e.target.dataset.status as string
    const url = s.url.get()

    switch (leadCol) {
      case '':
      case 'total':
        batch(() => {
          const nURL = removeLeadColInApolloURL(url)
          s.url.set( nURL )
          if (!nURL.includes(`prospectedByCurrentTeam[]=${s.leadCol.get()}`)) s.leadCol.set('total')
        })
        break
      case 'new':
        batch(() => {
          const nURL = setLeadColInApolloURL(url, 'no')
          s.url.set( nURL )
          if (nURL.includes('prospectedByCurrentTeam[]=no')) s.leadCol.set(leadCol)
        })
        break
    }
  }

  // const aar = () => {
  //   const {min, max, chunkParts} = s.get()

  //   if (!min || !max || !chunkParts) return { chunk: [], accounts: []}
    

  //   const chunk = chuckRange(min, max, chunkParts)
  //   const accounts = selectAccForScrapingFILO(chunk.length)

  //   return { 
  //     chunk,
  //     accounts: accounts.map(a => a.domainEmail )
  //   }
  // }

  const resetState = () => { s.set(defaultState) }
  
  return (
    <form onSubmit={handleSubmit}>
     

      <div className='mb-3 text-left'>
        <label className='mr-2' htmlFor="startScrape">URL: </label>
        <input className="mr-2 w-[50%]" required type="text" id="startScrape" disabled={!!s.url.get()} value={s.url.get()} onChange={(e) => {handleInput(e.target.value)}}/>
        <div className={`inline text-cyan-600 text-xl ${ !s.get().url ? 'hidden' : ''}`} onClick={() => {resetState()}}> <IoMdCloseCircle fill='rgb(8 145 178 / 1)' /> </div>
        <input disabled={!s.url.get()} className='text-cyan-600 border-cyan-600 border rounded p-1 disabled:border-neutral-500 disabled:text-neutral-500' type="submit" value="Start Scraping"/>
      </div>
   


      <div className='mb-3 flex gap-5'>
        <div className='mb-3 text-left'>
          <div className='mb-2'> ------- Employee Range ------- </div>

          <div className='mb-3'>
            <label className='mr-2' htmlFor="scrapeFrom">Min: </label>
            <input required id='scrapeFrom' type="number" min='1'  value={s.min.get()} onChange={(e: any) => {handleRange(e.target.value, 'min')} }/>
          </div>

          <div className='mb-3'>
            <label className='mr-2' htmlFor="scrapeTo">Max: </label>
            <input required id='scrapeTo' className='mr-2' type="number" min='1' value={s.max.get()} onChange={(e: any) => {handleRange(e.target.value, 'max')} }/>
          </div>

        </div>

        <div className='mb-3'>
          <div className='mb-5'>
            <div className='mb-1'> ------- Email Status ------- </div>
            <div className="email" onClick={handleEmailStatus}>
              <div>* Leave all boxes unchecked to include all types  </div>
              <div><input type="checkbox" id="email" name="email" value="verified" data-status='verified' checked={s.checkedStatus.get().includes('verified')}/> Verified </div>
              <div><input type="checkbox" id="email" name="email" value="guessed" data-status='guessed'  checked={s.checkedStatus.get().includes('guessed')}/> Guessed </div>
            </div>
          </div>

          <div>
            <div className='mb-1'> ------- Lead Column ------- </div>
            <div className="lead" onClick={handleLeadCol}>
              <div> <input type="checkbox" id="lead" name="lead" value="total" data-status='total' checked={s.leadCol.get().includes('total')}/> Total </div>
              <div> <input type="checkbox" id="lead" name="lead" value="new" data-status='new'  checked={s.leadCol.get().includes('new')}/> Net New </div>
            </div>
          </div>
        </div>

        <div className='mb-3 w-[20rem] text-sm'>
          <div className='mb-5'>
            <div className='mb-1'> ------- Accounts For Scrape ------- </div>
            <ChunkComp aar={s.aar.get()} />
          </div>

        </div>

      </div>
    </form>
  )
})

type ChunkCompProps = {
  aar: {
    accounts: string[],
    chunk: [min:number, max: number][]
  }
}

const ChunkComp = ({aar}: ChunkCompProps) => {

  return (
    <div className="scrape w-full">
      {
        aar.chunk.length && (
          <table className="text-left">
            <thead>
              <tr>
                <th className='px-2'> Accounts </th>
                <th className='px-2'> Range </th>
              </tr>
            </thead>
            <tbody>
              {
                aar.chunk.map((aar0, idx) => (
                  aar.accounts[idx]
                    ? (
                      <tr key={idx} className="">
                        <td className='overflow-scroll truncate max-w-2'>{aar.accounts[idx]}</td>
                        <td className='overflow-scroll truncate'>{`${aar0[0]} - ${aar0[1]}`}</td>
                      </tr>
                    )
                    : (
                      <tr key={idx} className="">
                        <td className='overflow-scroll truncate max-w-2'>No Account Available</td>
                        <td className='overflow-scroll truncate'>{`${aar0[0]} - ${aar0[1]}`}</td>
                      </tr>
                    )
                ))
              }
            </tbody>
          </table>
        )
      }
    </div>
  )
}

// const aar = () => {
//   const chunk = chuckRange(min.get(), max.get(), chunkParts.get())
//   const accounts = selectAccForScrapingFILO(chunk.length)

//   const accountsAndRange = () => {
//     const {min, max, chunkParts} = s.get()
//     if (!min || !max || !chunkParts) return

//     const chunk = chuckRange(min, max, chunkParts)
//     const accounts = selectAccForScrapingFILO(chunk.length)

//     return {
//       chunk,
//       accounts
//     }
//   }

// }