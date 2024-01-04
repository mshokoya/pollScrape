import proxyVerifier from 'proxy-verifier';

export const selectAccForScrapingFILO = (userAccounts) => {
  return userAccounts.reduce((acc, cv) => {
    if (cv.lastUsed < acc.lastUsed) {
      return cv
    }
  }, Infinity)
}


export const rmPageFromURLQuery = (url) => {
  const myURL = new URL(url);
  const pageNum = myURL.searchParams.get('page');
  myURL.searchParams.delete('page');

  return {
    url:  myURL.href,
    page: pageNum ? pageNum : 1
  }
}

export const parseProxy = (proxy) => {
  const split = proxy.split('://'); // ["http", "0.0.0.0:8000"]
  const split2 = split[1].split(':') // ["0.0.0.0", "8000"]
  
  return {
    proxy,
    protocol: split[0],
    ipAddress: split2[0],
    port: split2[1]
  }
}

export const verifyProxy = (proxy) => {
  return proxyVerifier.test(
    parseProxy(proxy), 
    (err, result) => {
      if (err) return false;
      return result.ok;
    }
  )
}

export function shuffleArray(array) {
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