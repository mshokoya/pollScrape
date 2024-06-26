//@ts-ignore
import proxyCheck from 'advanced-proxy-checker'
import { IAccount } from './models/accounts'
import { shuffleArray } from '../util'
import { IProxy, ProxyModel_ } from './models/proxy'
import { getAllApolloAccounts } from '.'
import { Mutex } from 'async-mutex'
import { cache } from '../cache'

const _AccLock = new Mutex()
const _ProxyLock = new Mutex()

export type Proxy = {
  proxy: string
  protocol: string
  host: string
  port: string
}

export type ProxyResponse = {
  valid: boolean
  status: string // "Connection Successful"
  data: {
    ip: string
    hostname: string
    city: string
    region: string
    country: string
    loc: string
    org: string
    postal: string
    timezone: string
    asn: {
      asn: string
      name: string
      domain: string
      route: string
      type: string
    }
    company: {
      name: string
      domain: string
      type: string
    }
    privacy: {
      vpn: boolean
      proxy: boolean
      tor: boolean
      relay: boolean
      hosting: boolean
      service: string
    }
    abuse: {
      address: string
      country: string
      email: string
      name: string
      network: string
      phone: string
    }
    fraudScore: number
    riskLevel: string
  }
}

// // 30mins id default 
// // (FIX) make sue acc is verified and not suspended, suspension is i time limit so check if count down is over
// // (FIX) TEST TO MAKE SURE IT WORKS (also test lock)
// // (FIX) handle situation where accsNeeded > allAccounts
// (FIX) remove cache & lock from this file to outside func
export const selectAccForScrapingFILO = async (
  metaID: string,
  accsNeeded: number
): Promise<(IAccount & { totalScrapedInLast30Mins: number })[]> => {
  const accs: (IAccount & { totalScrapedInLast30Mins: number })[] = []

  const allAccInUse = await cache.getAllAccountIDs()
  const allAccounts = (await getAllApolloAccounts()).filter(
    (a) => a.verified === 'yes' && !allAccInUse.includes(a.id)
  ) as (IAccount & { totalScrapedInLast30Mins: number })[]

  // console.log('allacc')
  // console.log(allAccounts)

  if (!allAccounts || !allAccounts.length) return []
  if (allAccounts.length < 15) {
    console.warn(
      'Send a waring via websockets. should have at least 15 to prevent accounts from getting locked for 10 days'
    )
  }

  if (allAccounts.length === 1) {
    allAccounts[0].totalScrapedInLast30Mins = totalLeadsScrapedInTimeFrame(allAccounts[0])
    return allAccounts
  }

  // get unused accounts first
  for (const a of allAccounts) {
    if (accsNeeded === 0) return accs
    if (!a.history.length) {
      accs.push({ ...a, totalScrapedInLast30Mins: 0 })
      accsNeeded--
    }
  }

  if (accsNeeded === 0) return accs

  // if not enough unused accounts left, get account that have been used the least in the last 30mins
  allAccounts.sort((a, b) => {
    const totalLeadsScrapedIn30MinsA = totalLeadsScrapedInTimeFrame(a)
    const totalLeadsScrapedIn30MinsB = totalLeadsScrapedInTimeFrame(b)
    a['totalScrapedInLast30Mins'] = totalLeadsScrapedIn30MinsA
    b['totalScrapedInLast30Mins'] = totalLeadsScrapedIn30MinsB
    return totalLeadsScrapedIn30MinsB - totalLeadsScrapedIn30MinsA
  })

  const accounts = accs.concat(allAccounts.splice(-accsNeeded))
  const accountIDs = accounts.map((a) => a.id)

  cache.addAccounts(metaID, accountIDs)

  return accounts
}

export const totalLeadsScrapedInTimeFrame = (a: IAccount) => {
  const timeLimit = 1000 * 60 * 30 // 30mins
  return a.history.reduce(
    (
      acc: number,
      cv: [
        amountOfLeadsScrapedOnPage: number,
        timeOfScrape: number,
        listName: string,
        scrapeID: string
      ]
    ) => {
      const isWithin30minMark = new Date().getTime() - cv[1] >= timeLimit

      return isWithin30minMark ? acc + (cv[0] as any) : acc
    },
    0
  )
}

export const apolloGetParamsFromURL = (url: string): Record<string, string> => {
  const myURL = new URLSearchParams(url.split('/#/')[1])
  const paramsObj = Object.fromEntries(new URLSearchParams(myURL))
  return paramsObj
}

// (FIX): impliment better proxy validation
export const parseProxy = (proxy: string): Proxy => {
  const split = proxy.split('://') // ["http", "0.0.0.0:8000"]
  const split2 = split[1].split(':') // ["0.0.0.0", "8000"]

  return {
    proxy,
    protocol: split[0] as string,
    host: split2[0],
    port: split2[1]
  }
}

// (FIX) dont use third party type
export const verifyProxy = async (proxy: string): Promise<ProxyResponse> => {
  const isOk: ProxyResponse = await proxyCheck.full(proxy)

  if (isOk.valid) {
    isOk.data = parseProxy(proxy)
  }

  return isOk
}

// (FIX) test function works
export const selectProxy = async (account: IAccount): Promise<string | null> => {
  try {
    await _ProxyLock.acquire()
    let doesProxyStillWork = await verifyProxy(account.proxy)

    if (doesProxyStillWork.valid) return account.proxy

    const allProxiesInUse = (await getAllApolloAccounts())
      // .filter((u) => u.proxy === account.proxy) // remove user from list  (??? why remove from list ?)
      .map((u) => u.proxy) //retrun list of proxies

    const getProxies = await ProxyModel_.findAll()

    if (!getProxies.length)
      throw new Error(
        'failed to find proxies to use, please add proxies, minimum 15, to be safe add 30'
      )

    let allProxiesNotInUse: string[] = getProxies
      .filter((p: IProxy) => !allProxiesInUse.includes(p.proxy))
      .map((p) => p.proxy)

    if (!allProxiesNotInUse.length)
      throw new Error(
        'failed to find proxies to use, all proxies are in use, please add proxies, minimum 15, to be safe add 30'
      )

    allProxiesNotInUse = shuffleArray(allProxiesNotInUse)

    for (const proxy of allProxiesNotInUse) {
      doesProxyStillWork = await verifyProxy(proxy)
      if (doesProxyStillWork.valid) return proxy
    }

    throw new Error(
      'failed to use proxies, try scrape again, its fails try adding new proxies, if that fails please contact the developer'
    )
  } finally {
    _ProxyLock.release()
  }
}
