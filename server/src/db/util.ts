
//@ts-ignore
import proxyCheck from 'advanced-proxy-checker';
import { IAccount } from './database';

export type Proxy = {
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


export const selectAccForScrapingFILO = (userAccounts: IAccount[]) => {
  return userAccounts.reduce((acc: IAccount, cv: any) => {
    if (cv.lastUsed < acc.lastUsed) {
      return cv
    }
  }, Infinity as any);
}

export const rmPageFromURLQuery = (url: string): {url: string, page: string} => {
  const myURL = new URL(url);
  const pageNum = myURL.searchParams.get('page');
  myURL.searchParams.delete('page');

  return {
    url:  myURL.href,
    page: pageNum ? pageNum : '1'
  }
}

// {proxy: string, protocol: string, ipAddress: string, port: string}
export const parseProxy = (proxy: string): Proxy => {
  const split = proxy.split('://'); // ["http", "0.0.0.0:8000"]
  const split2 = split[1].split(':'); // ["0.0.0.0", "8000"]
  
  return {
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
  
  console.log('isOk')
  console.log(isOk)

  return isOk;
}

export function shuffleArray(array: string[]): string[] {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}