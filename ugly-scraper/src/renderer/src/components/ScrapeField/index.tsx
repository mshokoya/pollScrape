import { observer, useObservable } from '@legendapp/state/react'
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  Heading,
  Separator,
  Text,
  TextArea,
  TextField
} from '@radix-ui/themes'
import { FormEvent, MouseEvent } from 'react'
import { GiCancel } from 'react-icons/gi'
import { CHANNELS } from '../../../../shared/util'
import {
  chuckRange,
  getEmailStatusFromApolloURL,
  getLeadColFromApolloURL,
  getRangeFromApolloURL,
  removeEmailStatusInApolloURL,
  removeLeadColInApolloURL,
  setEmailStatusInApolloURL,
  setLeadColInApolloURL,
  setRangeInApolloURL
} from '@renderer/core/util'
import { batch } from '@legendapp/state'
import { selectAccForScrapingFILO } from '@renderer/core/state/account'
import { appState$ } from '@renderer/core/state'
import { Chunk } from './Chunk'

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

const defaultState = () => ({
  name: '',
  reqInProcess: false,
  url: '',
  min: 1,
  max: 1000000,
  maxScrapeLimit: 1000,
  checkedStatus: ['verified'],
  leadCol: 'total',
  chunkParts: 1,
  aar: {
    chunk: [],
    accounts: []
  }
})

export const ScrapeField = observer(() => {
  console.log('ScrapeField')

  const s = useObservable<State>(defaultState())

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    s.reqInProcess.set(true)

    const state = s.peek()

    // (FIX) throw error or warning to user the not enough accounts or chunk too high etc

    // s.aar.set({
    //   chunk: [[50, 500]],
    //   accounts: [state.aar.accounts[0]]
    // })

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

  const handleEmailStatus = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent> | any) => {
    if (!s.url.peek().includes('https://app.apollo.io/#/people?finderViewId=')) return

    // @ts-ignore
    const status = e.target.value as string
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

  const handleLeadCol = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent> | any) => {
    e.stopPropagation()
    if (!s.url.peek().includes('https://app.apollo.io/#/people?finderViewId=')) return

    // @ts-ignore
    const leadCol = e.target.value as string
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
    s.set(defaultState())
  }

  const handleChunkPart = (val: 'inc' | 'dec') => {
    const cp = s.chunkParts.peek()
    const numOfAccs = appState$.accounts.length

    if (val === 'inc' && cp + 1 > numOfAccs) return
    if (val === 'dec' && cp - 1 <= 0) return

    const newChunk = val === 'inc' ? cp + 1 : cp - 1

    batch(() => {
      s.chunkParts.set(newChunk)
      s.aar.set(aar(s.min.peek(), s.max.peek(), newChunk))
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" align="start" gap="3">
        {/* COLUMN 1a */}
        <Flex align="center" gap="1">
          <Text>URL: </Text>
          <TextArea
            required
            disabled={!!s.url.get()}
            value={s.url.get()}
            onChange={(e) => {
              handleInput(e.target.value)
            }}
            size="1"
            resize="vertical"
            placeholder="Search the docs…"
            className="w-[25rem] max-h-[10rem]"
          />

          <Box
            className={`text-cyan-600 text-xl ${!s.url.get() ? 'hidden' : ''}`}
            onClick={() => {
              resetState()
            }}
          >
            <GiCancel fill="rgb(8 145 178 / 1)" />
          </Box>

          <Button variant="solid">
            <input disabled={!s.url.get()} type="submit" value="Start Scraping" />
          </Button>
        </Flex>

        {/* COLUMN 1b */}
        <Flex gap="5" align="center">
          {/* ROW 1a */}
          <Flex direction="column" gap="3">
            <Flex direction="column" align="center" gap="2">
              <Text size="2">Scrape name</Text>
              <TextField.Root
                required
                size="2"
                onChange={(e: any) => {
                  s.name.set(e.target.value)
                }}
                placeholder="Search the docs…"
              />
            </Flex>

            <Separator size="4" />

            <Flex direction="column" align="center" gap="2">
              <Text size="2">Employee Range</Text>
              <TextField.Root
                required
                size="2"
                type="number"
                value={s.min.get()}
                onChange={(e: any) => {
                  handleRange(e.target.value, 'min')
                }}
                placeholder="Minimum range"
              />
              <TextField.Root
                required
                size="2"
                type="number"
                value={s.max.get()}
                onChange={(e: any) => {
                  handleRange(e.target.value, 'max')
                }}
                placeholder="Maximum range"
              />
            </Flex>
          </Flex>

          <Flex direction="column" gap="3" justify="center">
            <Separator orientation="vertical" size="3" />
          </Flex>

          {/* ROW 1b */}
          <Flex direction="column" gap="3">
            <Flex direction="column" align="center" gap="2">
              <Text size="2">Email status</Text>
              <Flex direction="column" gap="1">
                <Text as="label" size="2">
                  <Flex gap="2">
                    <Checkbox
                      value="verified"
                      data-status="verified"
                      onClick={handleEmailStatus}
                      checked={s.checkedStatus.get().includes('verified')}
                    />
                    verified
                  </Flex>
                </Text>
                <Text as="label" size="2">
                  <Flex gap="2">
                    <Checkbox
                      value="guessed"
                      data-status="guessed"
                      onClick={handleEmailStatus}
                      checked={s.checkedStatus.get().includes('guessed')}
                    />
                    guessed
                  </Flex>
                </Text>
              </Flex>
            </Flex>

            <Separator size="4" />

            <Flex direction="column" align="center" gap="2">
              <Text size="2">Lead column</Text>

              <Flex direction="column" gap="1">
                <Text as="label" size="2">
                  <Flex gap="2">
                    <Checkbox
                      value="total"
                      onClick={handleLeadCol}
                      checked={s.leadCol.get().includes('total')}
                    />
                    Total
                  </Flex>
                </Text>
                <Text as="label" size="2">
                  <Flex gap="2">
                    <Checkbox
                      value="new"
                      onClick={handleLeadCol}
                      checked={s.leadCol.get().includes('new')}
                    />
                    Net new
                  </Flex>
                </Text>
              </Flex>

              {/* <CheckboxGroup.Root defaultValue={[s.leadCol.get()]} name="lead">
                <CheckboxGroup.Item value="total">Total</CheckboxGroup.Item>
                <CheckboxGroup.Item value="new">Net new</CheckboxGroup.Item>
              </CheckboxGroup.Root> */}
            </Flex>
          </Flex>

          <Flex direction="column" gap="3" justify="center">
            <Separator orientation="vertical" size="3" />
          </Flex>

          {/* ROW 2a */}
          <Flex direction="column" gap="3">
            <Chunk
              aar={s.aar.get()}
              chunkParts={s.chunkParts.get()}
              handleChunkPart={handleChunkPart}
              maxScrapeLimit={s.maxScrapeLimit.get()}
            />
          </Flex>
        </Flex>
      </Flex>
    </form>
  )
})