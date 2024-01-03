import proxyVerifier, { Protocol, Proxy } from 'proxy-verifier';
import { IAccount } from './database';

export const selectAccForScrapingFILO = (userAccounts: IAccount[]) => {
  return userAccounts.reduce((acc: IAccount, cv: any) => {
    if (cv.lastUsed < acc.lastUsed) {
      return cv
    }
  }, Infinity as any)
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
  const split2 = split[1].split(':') // ["0.0.0.0", "8000"]
  
  return {
    protocol: split[0] as Protocol,
    ipAddress: split2[0],
    port: parseInt(split2[1])
  }
}

export const verifyProxy = (proxy: string): boolean => {
  let isOk: boolean;
  proxyVerifier.test(
    parseProxy(proxy), 
    (err, result) => {
      if (err) return false;
      isOk = result.ok;
    }
  )

  return isOk!;
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