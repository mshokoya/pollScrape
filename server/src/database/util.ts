
//@ts-ignore
import proxyCheck from 'advanced-proxy-checker';
import { IAccount } from './models/accounts';
import { shuffleArray } from '../util';
import { IProxy, ProxyModel } from './models/proxy';

export type Proxy = {
  proxy: string;
  protocol: string;
  host: string;
  port: string;
}

export type ProxyResponse = {
  valid: boolean,
  status: string, // "Connection Successful"
  data: {
    ip: string;
    hostname: string;
    city: string;
    region: string;
    country: string;
    loc: string;
    org: string;
    postal: string;
    timezone: string;
    asn: {
      asn: string;
      name: string;
      domain: string;
      route: string;
      type: string;
    },
    company: {
      name: string;
      domain: string;
      type: string;
    },
    privacy: {
      vpn: boolean
      proxy: boolean
      tor: boolean
      relay: boolean
      hosting: boolean
      service: string;
    },
    abuse: {
      address: string;
      country: string;
      email: string;
      name: string;
      network: string;
      phone: string;
    },
    fraudScore: number
    riskLevel: string;
  }
}


// 30mins
// (FIX) TEST TO MAKE SURE IT WORKS
export const selectAccForScrapingFILO = (userAccounts: IAccount[], accsNeeded: number): (IAccount & {totalScrapedInLast30Mins: number})[] => {
  const accs: (IAccount & {totalScrapedInLast30Mins: number})[] = []

  // get unused accounts first
  for (let a of userAccounts) {
    if (accsNeeded === 0) return accs
    if (!a.history.length) {
      accs.push({...a, totalScrapedInLast30Mins: 0})
      accsNeeded--
    }
  }
  // if not enough unused accounts left, get account that have been used the least in the last 30mins
  const ua: (IAccount & {totalScrapedInLast30Mins: number})[] = JSON.parse(JSON.stringify(userAccounts))
  ua.sort((a, b) => {
    const totalLeadsScrapedIn30MinsA = totalLeadsScrapedInTimeFrame(a)
    const totalLeadsScrapedIn30MinsB = totalLeadsScrapedInTimeFrame(b)
    a.totalScrapedInLast30Mins = totalLeadsScrapedIn30MinsA
    b.totalScrapedInLast30Mins = totalLeadsScrapedIn30MinsB
    return totalLeadsScrapedIn30MinsB-totalLeadsScrapedIn30MinsA
  })
  
  return accs.concat(ua.splice(-accsNeeded))
}

// (FIX) cv[1] could error because in db default value is not set (noe set on instanciation)
export const totalLeadsScrapedInTimeFrame = (a: IAccount) => {
  const timeLimit = 1000 * 60 * 30; // 30mins
  return a.history.reduce((acc: number, cv: [amountOfLeadsScrapedOnPage: number, timeOfScrape: Date]) => {
    const isWithin30minMark = new Date().getTime() - (cv[1] as any) >= timeLimit 
    return isWithin30minMark
      ? acc + (cv[1] as any)
      : acc
  }, 0)
}



export const rmPageFromURLQuery = (url: string): {url: string, page: number, params: Record<string, string>} => {
  const myURL = new URL(url);
  const pageNum = myURL.searchParams.get('page');
  myURL.searchParams.delete('page');
  
  const paramsObj = Object.fromEntries(new URLSearchParams(myURL.search))

  return {
    url:  myURL.href,
    params: paramsObj,
    page: pageNum ? parseInt(pageNum) : 1
  }
}

// (FIX): impliment better proxy validation
export const parseProxy = (proxy: string): Proxy => {
  const split = proxy.split('://'); // ["http", "0.0.0.0:8000"]
  const split2 = split[1].split(':'); // ["0.0.0.0", "8000"]

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

  return isOk;
}

export const selectProxy = async (account: IAccount, allAccounts: IAccount[]): Promise<string | null> => {
  let doesProxyStillWork = await verifyProxy(account.proxy)

  if (doesProxyStillWork.valid) return account.proxy;

  const allProxiesInUse = allAccounts
    // .filter((u) => u.proxy === account.proxy) // remove user from list  (??? why remove from list ?)
    .map((u) => u.proxy) //retrun list of proxies

  let getProxies = (ProxyModel.find({}).lean() as unknown) as IProxy[]

  if (!getProxies.length) throw new Error('failed to find proxies to use, please add proxies, minimum 15, to be safe add 30');

  let allProxiesNotInUse: string[] = getProxies
    .filter((p: IProxy) => !allProxiesInUse.includes(p.proxy))
    .map(p => p.proxy );

  if (!allProxiesNotInUse.length) throw new Error('failed to find proxies to use, all proxies are in use, please add proxies, minimum 15, to be safe add 30')

  allProxiesNotInUse = shuffleArray(allProxiesNotInUse)
  
  for (let proxy of allProxiesNotInUse) {
    doesProxyStillWork = await verifyProxy(proxy)
    if (doesProxyStillWork.valid) return proxy;
  }

  throw new Error('failed to use proxies, try scrape again, its fails try adding new proxies, if that fails please contact the developer')
}