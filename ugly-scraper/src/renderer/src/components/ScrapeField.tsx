import { FormEvent, MouseEvent } from 'react'
import {
  chuckRange,
  fetchData,
  getEmailStatusFromApolloURL,
  getLeadColFromApolloURL,
  getRangeFromApolloURL,
  removeEmailStatusInApolloURL,
  removeLeadColInApolloURL,
  setEmailStatusInApolloURL,
  setLeadColInApolloURL,
  setRangeInApolloURL
} from '../core/util'
import { batch } from '@legendapp/state'
import { observer, useObservable } from '@legendapp/state/react'
import { selectAccForScrapingFILO } from '../core/state/account'
import { IoMdCloseCircle } from 'react-icons/io'
import { FaArrowCircleLeft, FaArrowCircleRight } from 'react-icons/fa'
import { CHANNELS } from '../../../shared/util'
import { Box, Checkbox, Flex, Heading, Text, TextField } from '@radix-ui/themes'

type State = {
  name: string
  reqInProcess: boolean
  url: string
  min?: number
  max?: number
  maxScrapeLimit: number
  checkedStatus: string[]
  leadCol: string
  chunkParts: number
  aar: {
    chunk: [number, number][]
    accounts: { id: string; email: string; totalScrapedInTimeFrame: number }[]
  }
}

// (FIX) SELECT CHUNK SHOULD NOT ALLOW TO CLICK LOWER THAT 1
export const ScrapeField = observer(() => {
  console.log('ScrapeField')
  const defaultState = {
    name: '',
    reqInProcess: false,
    url: '',
    min: 1,
    max: 1000000,
    maxScrapeLimit: 1000,
    checkedStatus: [],
    leadCol: 'total',
    chunkParts: 1,
    aar: {
      chunk: [],
      accounts: []
    }
  }
  // @ts-ignore
  const s = useObservable<State>(defaultState)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    s.reqInProcess.set(true)

    const state = s.peek()

    // (FIX) throw error or warning to user the not enough accounts or chunk too high etc

    s.aar.set({
      chunk: [[50, 500]],
      accounts: [state.aar.accounts[0]]
    })

    if (s.aar.chunk.length !== s.aar.accounts.length) return

    await fetchData('scrape', CHANNELS.a_scrape, {
      name: state.name,
      url: state.url,
      chunk: state.aar.chunk,
      accounts: state.aar.accounts.map((a) => a.id),
      usingProxy: false
    })
      .then((d) => {
        console.log(d)
      })
      .catch((err) => {
        console.error(err)
      })
      .finally(() => {
        s.reqInProcess.set(false)
      })
  }

  const handleInput = (urll: string) => {
    if (!urll.includes('https://app.apollo.io/#/people?finderViewId=')) {
      return
    }

    const range = getRangeFromApolloURL(urll)
    const min = !range[0] ? 1 : range[0]
    const max = !range[1] ? 10000000 : range[1]
    const url = setRangeInApolloURL(urll, [min, max])
    const emailStatus = getEmailStatusFromApolloURL(url)
    let leadCol: string | null = getLeadColFromApolloURL(url)
    leadCol = !leadCol ? 'total' : leadCol === 'no' ? 'new' : null

    batch(() => {
      s.min.set(min)
      s.max.set(max)
      s.url.set(url)
      s.checkedStatus.set(emailStatus)
      s.aar.set(aar(min, max, s.chunkParts.peek()))
      if (!leadCol) {
        s.url.set(removeLeadColInApolloURL(url))
        s.leadCol.set('total')
      } else {
        s.leadCol.set(leadCol)
      }
    })
  }

  const handleRange = (v: string, rng: 'min' | 'max') => {
    const val = parseInt(v)
    if (!s.url.peek().includes('https://app.apollo.io/#/people?finderViewId=')) return

    const min = rng === 'min' ? (Number.isNaN(val) ? 1 : val) : s.min.peek()

    const max = rng === 'max' ? (Number.isNaN(val) ? 10000000 : val) : s.max.peek()

    if (min >= max || min <= 0 || Number.isNaN(val)) return

    const url = setRangeInApolloURL(s.url.peek(), [min, max])

    batch(() => {
      s.url.set(url)
      rng === 'min' ? s.min.set(val) : s.max.set(val)
      s.aar.set(aar(min, max, s.chunkParts.peek()))
    })
  }

  const handleEmailStatus = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation()

    if (!s.url.peek().includes('https://app.apollo.io/#/people?finderViewId=')) return

    // @ts-ignore
    const status = e.target.dataset.status as string
    const url = s.url.get()

    if (!status) return

    s.checkedStatus.get().includes(status)
      ? batch(() => {
          const nURL = removeEmailStatusInApolloURL(url, status)
          s.url.set(nURL)
          if (!nURL.includes(`contactEmailStatus[]=${status}`))
            s.checkedStatus.set((v) => v.filter((v0) => v0 !== status))
        })
      : batch(() => {
          const nURL = setEmailStatusInApolloURL(url, status)
          s.url.set(nURL)
          if (nURL.includes(`contactEmailStatus[]=${status}`)) s.checkedStatus.push(status)
        })
  }

  const handleLeadCol = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
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
          s.url.set(nURL)
          if (!nURL.includes(`prospectedByCurrentTeam[]=${s.leadCol.get()}`)) s.leadCol.set('total')
        })
        break
      case 'new':
        batch(() => {
          const nURL = setLeadColInApolloURL(url, 'no')
          s.url.set(nURL)
          if (nURL.includes('prospectedByCurrentTeam[]=no')) s.leadCol.set(leadCol)
        })
        break
    }
  }

  const aar = (min: number, max: number, chunkParts: number) => {
    if (!min || !max || !chunkParts) return { chunk: [], accounts: [] }

    const chunk = chuckRange(min, max, chunkParts)
    const accounts = selectAccForScrapingFILO(chunkParts)

    return {
      chunk,
      accounts: accounts.map((a) => ({
        id: a.id,
        email: a.email,
        totalScrapedInTimeFrame: a.totalScrapedInLast30Mins
      }))
    }
  }

  const resetState = () => {
    s.set(defaultState)
  }

  const handleChunkPart = (val: 'inc' | 'dec') => {
    const cp = s.chunkParts.peek()

    const newChunk = val === 'inc' ? cp + 1 : cp - 1

    batch(() => {
      s.chunkParts.set(newChunk)
      s.aar.set(aar(s.min.peek(), s.max.peek(), newChunk))
    })
  }

  return (
    <form className="w-full bg-[#111111]" onSubmit={handleSubmit}>
      <div className="mb-3 text-left flex items-center">
        <label className="mr-2" htmlFor="startScrape">
          URL:{' '}
        </label>
        <textarea
          className="mr-1 w-[50%] rounded"
          required
          id="startScrape"
          disabled={!!s.url.get()}
          value={s.url.get()}
          onChange={(e) => {
            handleInput(e.target.value)
          }}
        />
        <div
          className={`mx-1 inline text-cyan-600 text-xl ${!s.get().url ? 'hidden' : ''}`}
          onClick={() => {
            resetState()
          }}
        >
          {' '}
          <IoMdCloseCircle fill="rgb(8 145 178 / 1)" />{' '}
        </div>
        <input
          disabled={!s.url.get()}
          className="overflow-scroll ml-1 text-cyan-600 border-cyan-600 border rounded p-1 disabled:border-neutral-500 disabled:text-neutral-500"
          type="submit"
          value="Start Scraping"
        />
      </div>

      <div className="mb-3 flex gap-5">
        <div className="mb-3">
          <div className="mb-3 flex gap-5">
            <div className="mb-3 text-center">
              <div className="mb-2 text-cyan-600"> ------- Scrape Name ------- </div>
              <input
                required
                className="mr-2"
                value={s.name.get()}
                onChange={(e: any) => {
                  s.name.set(e.target.value)
                }}
              />
            </div>
          </div>

          <div className="mb-3 text-left">
            <div className="mb-2 text-cyan-600"> ------- Employee Range ------- </div>

            <div className="mb-3">
              <label className="mr-2" htmlFor="scrapeFrom">
                Min:{' '}
              </label>
              <input
                required
                id="scrapeFrom"
                type="number"
                value={s.min.get()}
                onChange={(e: any) => {
                  handleRange(e.target.value, 'min')
                }}
              />
            </div>

            <div className="mb-3">
              <label className="mr-2" htmlFor="scrapeTo">
                Max:{' '}
              </label>
              <input
                required
                id="scrapeTo"
                className="mr-2"
                type="number"
                value={s.max.get()}
                onChange={(e: any) => {
                  handleRange(e.target.value, 'max')
                }}
              />
            </div>
          </div>
        </div>

        <div className="mb-3">
          <div className="mb-5">
            <div className="mb-1 text-cyan-600"> ------- Email Status ------- </div>
            <div className="email" onClick={handleEmailStatus}>
              <div>* Leave all boxes unchecked to include all types </div>
              <div>
                <input
                  type="checkbox"
                  id="email"
                  name="email"
                  value="verified"
                  data-status="verified"
                  checked={s.checkedStatus.get().includes('verified')}
                />{' '}
                Verified{' '}
              </div>
              <div>
                <input
                  type="checkbox"
                  id="email"
                  name="email"
                  value="guessed"
                  data-status="guessed"
                  checked={s.checkedStatus.get().includes('guessed')}
                />{' '}
                Guessed{' '}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1 text-cyan-600"> ------- Lead Column ------- </div>
            <div className="lead" onClick={handleLeadCol}>
              <div>
                {' '}
                <input
                  type="checkbox"
                  id="lead"
                  name="lead"
                  value="total"
                  data-status="total"
                  checked={s.leadCol.get().includes('total')}
                />{' '}
                Total{' '}
              </div>
              <div>
                {' '}
                <input
                  type="checkbox"
                  id="lead"
                  name="lead"
                  value="new"
                  data-status="new"
                  checked={s.leadCol.get().includes('new')}
                />{' '}
                Net New{' '}
              </div>
            </div>
          </div>
        </div>

        <div className=" text-sm">
          <div className="">
            <div className="mb-1 text-cyan-600"> ------- Accounts For Scrape ------- </div>
            <ChunkComp
              maxScrapeLimit={s.maxScrapeLimit.get()}
              aar={s.aar.get()}
              chunkParts={s.chunkParts.get()}
              handleChunkPart={handleChunkPart}
            />
          </div>
        </div>
      </div>
    </form>
  )
})

type ChunkCompProps = {
  aar: {
    accounts: { email: string; totalScrapedInTimeFrame: number }[]
    chunk: [min: number, max: number][]
  }
  maxScrapeLimit: number
  chunkParts: number
  handleChunkPart: (val: 'inc' | 'dec') => void
}

const ChunkComp = ({ aar, chunkParts, handleChunkPart, maxScrapeLimit }: ChunkCompProps) => {
  if (!aar.chunk.length) return <div></div>

  return (
    <div className="scrape">
      <div className="chunk text-left mb-2">
        <label className="mr-2" htmlFor="chunk">
          Chunk:{' '}
        </label>
        <span
          className={`mx-1 inline text-cyan-600 text-xl`}
          onClick={() => {
            handleChunkPart('dec')
          }}
        >
          {' '}
          <FaArrowCircleLeft fill="rgb(8 145 178 / 1)" />{' '}
        </span>
        <span> {chunkParts} </span>
        <span
          className={`mx-1 inline text-cyan-600 text-xl`}
          onClick={() => {
            handleChunkPart('inc')
          }}
        >
          {' '}
          <FaArrowCircleRight fill="rgb(8 145 178 / 1)" />{' '}
        </span>
      </div>
      <div className="h-[10rem] overflow-y-scroll">
        {aar.chunk?.length && (
          <table className="text-left">
            <thead>
              <tr className="border-b-2 border-cyan-600">
                <th className="mr-4"> Accounts </th>
                <th className="mr-4"> Range </th>
                <th className="mr-4"> Estimated Scrape </th>
              </tr>
            </thead>
            <tbody>
              {aar.chunk.map((aar0, idx) =>
                aar.accounts[idx] ? (
                  <tr key={idx} className="">
                    <td className="pr-7 overflow-scroll truncate max-w-2">
                      {aar.accounts[idx].email}
                    </td>
                    <td className="pr-7 overflow-scroll truncate">{`${aar0[0]} - ${aar0[1]}`}</td>
                    <td className="">
                      {maxScrapeLimit - aar.accounts[idx].totalScrapedInTimeFrame}
                    </td>
                  </tr>
                ) : (
                  <tr key={idx} className="">
                    <td className="overflow-scroll truncate max-w-2">No Account Available</td>
                    <td className="overflow-scroll truncate">{`${aar0[0]} - ${aar0[1]}`}</td>
                    <td className="overflow-scroll truncate"> - </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ========================================================
// ========================================================
// ========================================================
// ========================================================

// import { FormEvent, MouseEvent } from 'react'
// import {
//   chuckRange,
//   fetchData,
//   getEmailStatusFromApolloURL,
//   getLeadColFromApolloURL,
//   getRangeFromApolloURL,
//   removeEmailStatusInApolloURL,
//   removeLeadColInApolloURL,
//   setEmailStatusInApolloURL,
//   setLeadColInApolloURL,
//   setRangeInApolloURL
// } from '../core/util'
// import { batch } from '@legendapp/state'
// import { observer, useObservable } from '@legendapp/state/react'
// import { selectAccForScrapingFILO } from '../core/state/account'
// import { IoMdCloseCircle } from 'react-icons/io'
// import { FaArrowCircleLeft, FaArrowCircleRight } from 'react-icons/fa'
// import { CHANNELS } from '../../../shared/util'

// type State = {
//   name: string
//   reqInProcess: boolean
//   url: string
//   min?: number
//   max?: number
//   maxScrapeLimit: number
//   checkedStatus: string[]
//   leadCol: string
//   chunkParts: number
//   aar: {
//     chunk: [number, number][]
//     accounts: { id: string; email: string; totalScrapedInTimeFrame: number }[]
//   }
// }

// // (FIX) SELECT CHUNK SHOULD NOT ALLOW TO CLICK LOWER THAT 1
// export const ScrapeField = observer(() => {
//   console.log('ScrapeField')
//   const defaultState = {
//     name: '',
//     reqInProcess: false,
//     url: '',
//     min: 1,
//     max: 1000000,
//     maxScrapeLimit: 1000,
//     checkedStatus: [],
//     leadCol: 'total',
//     chunkParts: 1,
//     aar: {
//       chunk: [],
//       accounts: []
//     }
//   }
//   // @ts-ignore
//   const s = useObservable<State>(defaultState)

//   const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault()
//     s.reqInProcess.set(true)

//     const state = s.peek()

//     // (FIX) throw error or warning to user the not enough accounts or chunk too high etc

//     s.aar.set({
//       chunk: [[50, 500]],
//       accounts: [state.aar.accounts[0]]
//     })

//     if (s.aar.chunk.length !== s.aar.accounts.length) return

//     await fetchData('scrape', CHANNELS.a_scrape, {
//       name: state.name,
//       url: state.url,
//       chunk: state.aar.chunk,
//       accounts: state.aar.accounts.map((a) => a.id),
//       usingProxy: false
//     })
//       .then((d) => {
//         console.log(d)
//       })
//       .catch((err) => {
//         console.error(err)
//       })
//       .finally(() => {
//         s.reqInProcess.set(false)
//       })
//   }

//   const handleInput = (urll: string) => {
//     if (!urll.includes('https://app.apollo.io/#/people?finderViewId=')) {
//       return
//     }

//     const range = getRangeFromApolloURL(urll)
//     const min = !range[0] ? 1 : range[0]
//     const max = !range[1] ? 10000000 : range[1]
//     const url = setRangeInApolloURL(urll, [min, max])
//     const emailStatus = getEmailStatusFromApolloURL(url)
//     let leadCol: string | null = getLeadColFromApolloURL(url)
//     leadCol = !leadCol ? 'total' : leadCol === 'no' ? 'new' : null

//     batch(() => {
//       s.min.set(min)
//       s.max.set(max)
//       s.url.set(url)
//       s.checkedStatus.set(emailStatus)
//       s.aar.set(aar(min, max, s.chunkParts.peek()))
//       if (!leadCol) {
//         s.url.set(removeLeadColInApolloURL(url))
//         s.leadCol.set('total')
//       } else {
//         s.leadCol.set(leadCol)
//       }
//     })
//   }

//   const handleRange = (v: string, rng: 'min' | 'max') => {
//     const val = parseInt(v)
//     if (!s.url.peek().includes('https://app.apollo.io/#/people?finderViewId=')) return

//     const min = rng === 'min' ? (Number.isNaN(val) ? 1 : val) : s.min.peek()

//     const max = rng === 'max' ? (Number.isNaN(val) ? 10000000 : val) : s.max.peek()

//     if (min >= max || min <= 0 || Number.isNaN(val)) return

//     const url = setRangeInApolloURL(s.url.peek(), [min, max])

//     batch(() => {
//       s.url.set(url)
//       rng === 'min' ? s.min.set(val) : s.max.set(val)
//       s.aar.set(aar(min, max, s.chunkParts.peek()))
//     })
//   }

//   const handleEmailStatus = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
//     e.stopPropagation()

//     if (!s.url.peek().includes('https://app.apollo.io/#/people?finderViewId=')) return

//     // @ts-ignore
//     const status = e.target.dataset.status as string
//     const url = s.url.get()

//     if (!status) return

//     s.checkedStatus.get().includes(status)
//       ? batch(() => {
//           const nURL = removeEmailStatusInApolloURL(url, status)
//           s.url.set(nURL)
//           if (!nURL.includes(`contactEmailStatus[]=${status}`))
//             s.checkedStatus.set((v) => v.filter((v0) => v0 !== status))
//         })
//       : batch(() => {
//           const nURL = setEmailStatusInApolloURL(url, status)
//           s.url.set(nURL)
//           if (nURL.includes(`contactEmailStatus[]=${status}`)) s.checkedStatus.push(status)
//         })
//   }

//   const handleLeadCol = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
//     e.stopPropagation()
//     if (!s.url.peek().includes('https://app.apollo.io/#/people?finderViewId=')) return

//     // @ts-ignore
//     const leadCol = e.target.dataset.status as string
//     const url = s.url.get()

//     switch (leadCol) {
//       case '':
//       case 'total':
//         batch(() => {
//           const nURL = removeLeadColInApolloURL(url)
//           s.url.set(nURL)
//           if (!nURL.includes(`prospectedByCurrentTeam[]=${s.leadCol.get()}`)) s.leadCol.set('total')
//         })
//         break
//       case 'new':
//         batch(() => {
//           const nURL = setLeadColInApolloURL(url, 'no')
//           s.url.set(nURL)
//           if (nURL.includes('prospectedByCurrentTeam[]=no')) s.leadCol.set(leadCol)
//         })
//         break
//     }
//   }

//   const aar = (min: number, max: number, chunkParts: number) => {
//     if (!min || !max || !chunkParts) return { chunk: [], accounts: [] }

//     const chunk = chuckRange(min, max, chunkParts)
//     const accounts = selectAccForScrapingFILO(chunkParts)

//     return {
//       chunk,
//       accounts: accounts.map((a) => ({
//         id: a.id,
//         email: a.email,
//         totalScrapedInTimeFrame: a.totalScrapedInLast30Mins
//       }))
//     }
//   }

//   const resetState = () => {
//     s.set(defaultState)
//   }

//   const handleChunkPart = (val: 'inc' | 'dec') => {
//     const cp = s.chunkParts.peek()

//     const newChunk = val === 'inc' ? cp + 1 : cp - 1

//     batch(() => {
//       s.chunkParts.set(newChunk)
//       s.aar.set(aar(s.min.peek(), s.max.peek(), newChunk))
//     })
//   }

//   return (
//     <form className="w-full" onSubmit={handleSubmit}>
//       <div className="mb-3 text-left flex items-center">
//         <label className="mr-2" htmlFor="startScrape">
//           URL:{' '}
//         </label>
//         <textarea
//           className="mr-1 w-[50%] rounded"
//           required
//           id="startScrape"
//           disabled={!!s.url.get()}
//           value={s.url.get()}
//           onChange={(e) => {
//             handleInput(e.target.value)
//           }}
//         />
//         <div
//           className={`mx-1 inline text-cyan-600 text-xl ${!s.get().url ? 'hidden' : ''}`}
//           onClick={() => {
//             resetState()
//           }}
//         >
//           {' '}
//           <IoMdCloseCircle fill="rgb(8 145 178 / 1)" />{' '}
//         </div>
//         <input
//           disabled={!s.url.get()}
//           className="overflow-scroll ml-1 text-cyan-600 border-cyan-600 border rounded p-1 disabled:border-neutral-500 disabled:text-neutral-500"
//           type="submit"
//           value="Start Scraping"
//         />
//       </div>

//       <div className="mb-3 flex gap-5">
//         <div className="mb-3">
//           <div className="mb-3 flex gap-5">
//             <div className="mb-3 text-center">
//               <div className="mb-2 text-cyan-600"> ------- Scrape Name ------- </div>
//               <input
//                 required
//                 className="mr-2"
//                 value={s.name.get()}
//                 onChange={(e: any) => {
//                   s.name.set(e.target.value)
//                 }}
//               />
//             </div>
//           </div>

//           <div className="mb-3 text-left">
//             <div className="mb-2 text-cyan-600"> ------- Employee Range ------- </div>

//             <div className="mb-3">
//               <label className="mr-2" htmlFor="scrapeFrom">
//                 Min:{' '}
//               </label>
//               <input
//                 required
//                 id="scrapeFrom"
//                 type="number"
//                 value={s.min.get()}
//                 onChange={(e: any) => {
//                   handleRange(e.target.value, 'min')
//                 }}
//               />
//             </div>

//             <div className="mb-3">
//               <label className="mr-2" htmlFor="scrapeTo">
//                 Max:{' '}
//               </label>
//               <input
//                 required
//                 id="scrapeTo"
//                 className="mr-2"
//                 type="number"
//                 value={s.max.get()}
//                 onChange={(e: any) => {
//                   handleRange(e.target.value, 'max')
//                 }}
//               />
//             </div>
//           </div>
//         </div>

//         <div className="mb-3">
//           <div className="mb-5">
//             <div className="mb-1 text-cyan-600"> ------- Email Status ------- </div>
//             <div className="email" onClick={handleEmailStatus}>
//               <div>* Leave all boxes unchecked to include all types </div>
//               <div>
//                 <input
//                   type="checkbox"
//                   id="email"
//                   name="email"
//                   value="verified"
//                   data-status="verified"
//                   checked={s.checkedStatus.get().includes('verified')}
//                 />{' '}
//                 Verified{' '}
//               </div>
//               <div>
//                 <input
//                   type="checkbox"
//                   id="email"
//                   name="email"
//                   value="guessed"
//                   data-status="guessed"
//                   checked={s.checkedStatus.get().includes('guessed')}
//                 />{' '}
//                 Guessed{' '}
//               </div>
//             </div>
//           </div>

//           <div>
//             <div className="mb-1 text-cyan-600"> ------- Lead Column ------- </div>
//             <div className="lead" onClick={handleLeadCol}>
//               <div>
//                 {' '}
//                 <input
//                   type="checkbox"
//                   id="lead"
//                   name="lead"
//                   value="total"
//                   data-status="total"
//                   checked={s.leadCol.get().includes('total')}
//                 />{' '}
//                 Total{' '}
//               </div>
//               <div>
//                 {' '}
//                 <input
//                   type="checkbox"
//                   id="lead"
//                   name="lead"
//                   value="new"
//                   data-status="new"
//                   checked={s.leadCol.get().includes('new')}
//                 />{' '}
//                 Net New{' '}
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className=" text-sm">
//           <div className="">
//             <div className="mb-1 text-cyan-600"> ------- Accounts For Scrape ------- </div>
//             <ChunkComp
//               maxScrapeLimit={s.maxScrapeLimit.get()}
//               aar={s.aar.get()}
//               chunkParts={s.chunkParts.get()}
//               handleChunkPart={handleChunkPart}
//             />
//           </div>
//         </div>
//       </div>
//     </form>
//   )
// })

// type ChunkCompProps = {
//   aar: {
//     accounts: { email: string; totalScrapedInTimeFrame: number }[]
//     chunk: [min: number, max: number][]
//   }
//   maxScrapeLimit: number
//   chunkParts: number
//   handleChunkPart: (val: 'inc' | 'dec') => void
// }

// const ChunkComp = ({ aar, chunkParts, handleChunkPart, maxScrapeLimit }: ChunkCompProps) => {
//   if (!aar.chunk.length) return <div></div>

//   return (
//     <div className="scrape ">
//       <div className="chunk text-left mb-2">
//         <label className="mr-2" htmlFor="chunk">
//           Chunk:{' '}
//         </label>
//         <span
//           className={`mx-1 inline text-cyan-600 text-xl`}
//           onClick={() => {
//             handleChunkPart('dec')
//           }}
//         >
//           {' '}
//           <FaArrowCircleLeft fill="rgb(8 145 178 / 1)" />{' '}
//         </span>
//         <span> {chunkParts} </span>
//         <span
//           className={`mx-1 inline text-cyan-600 text-xl`}
//           onClick={() => {
//             handleChunkPart('inc')
//           }}
//         >
//           {' '}
//           <FaArrowCircleRight fill="rgb(8 145 178 / 1)" />{' '}
//         </span>
//       </div>
//       <div className="h-[10rem] overflow-y-scroll">
//         {aar.chunk?.length && (
//           <table className="text-left">
//             <thead>
//               <tr className="border-b-2 border-cyan-600">
//                 <th className="mr-4"> Accounts </th>
//                 <th className="mr-4"> Range </th>
//                 <th className="mr-4"> Estimated Scrape </th>
//               </tr>
//             </thead>
//             <tbody>
//               {aar.chunk.map((aar0, idx) =>
//                 aar.accounts[idx] ? (
//                   <tr key={idx} className="">
//                     <td className="pr-7 overflow-scroll truncate max-w-2">
//                       {aar.accounts[idx].email}
//                     </td>
//                     <td className="pr-7 overflow-scroll truncate">{`${aar0[0]} - ${aar0[1]}`}</td>
//                     <td className="">
//                       {maxScrapeLimit - aar.accounts[idx].totalScrapedInTimeFrame}
//                     </td>
//                   </tr>
//                 ) : (
//                   <tr key={idx} className="">
//                     <td className="overflow-scroll truncate max-w-2">No Account Available</td>
//                     <td className="overflow-scroll truncate">{`${aar0[0]} - ${aar0[1]}`}</td>
//                     <td className="overflow-scroll truncate"> - </td>
//                   </tr>
//                 )
//               )}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   )
// }
