import { Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import { scraper, visitGoogle } from "./scraper"
import { logIntoApollo } from '.';
import { updateAccount } from '../database';
import { IAccount } from '../database/models/accounts';

// ================ 
//full = https://app.apollo.io/#/onboarding/checklist
export const apolloLoggedInURLSubstr = "onboarding/checklist"
// ================ 
//full = https://app.apollo.io/#/login
export const apolloLoggedOutURLSubstr = "#/login"
// ================ 
//full = // https://app.apollo.io/#/people
export const apolloPeopleURLSubstr = "/people"
export const apolloTableRowSelector = ".zp_RFed0"


export const setBrowserCookies = async (page: Page, cookies: string) => {
  const items = JSON.parse(cookies)
    .map( (cookie: Record<string, string>) => {
      const item = Object.assign({}, cookie);
      if (!item.value) item.value = "";
      console.assert(!item.url, `Cookies must have a URL defined`);
      console.assert(
        item.url !== "about:blank",
        `Blank page can not have cookie "${item.name}"`
      );
      console.assert(
        !String.prototype.startsWith.call(item.url || "", "data:"),
        `Data URL page can not have cookie "${item.name}"`
      );
      return item;
  })
  .filter( (cookie: Record<string, string>) => cookie.name);

  await page.deleteCookie(...items);

  if (items.length){
    const client = await page.target().createCDPSession();
    await client.send('Network.setCookies',  { cookies: items });
  }
};

export const getBrowserCookies = async (): Promise<string[]> => {
  const client = await scraper.page()!.target().createCDPSession();
  const { cookies } = await client.send('Network.getAllCookies');

  return (cookies as unknown) as string[];
};

export const waitForNavigationTo = (location: string) => new Promise((resolve, _reject) => {
    const pg = scraper.page() as Page
    
    const browser_check = setInterval(async () => {
      if ( pg.url().includes(location) ) {
        clearInterval(browser_check);
        resolve(true);
      } else if ( (await scraper.browser()!.pages()).length === 0) {
        clearInterval(browser_check);
        throw new Error("failed to get cookies please head to 'settings/account' page when loggeed in")
      }
    }, 3000);
  }
);

export const delay = (time: number) => {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

export const injectCookies = async (cookies?: string) => {
  const page = scraper.page() as Page;

  await visitGoogle();
  if (cookies) {
    await setBrowserCookies(page, cookies); // needs work (cookest from string to array)
  }
}

export const hideDom = async () => {
  const page = scraper.page() as Page;
  await page.evaluate(() => {
    const ol = document.createElement('div')
    ol.className = 'zombie-s'
    ol.style.cssText += 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:1000;background-color:black;pointer-events:none;display:flex;justify-content:center;align-items:center; font-size: 70%; color: white';
    ol.innerText = 'Please do not do anything until this message is gone'
    const dom = document.querySelector('html')
    if (!dom) return ;
    dom.insertBefore(ol, dom.firstChild)
  })
}

export const visibleDom = async (page: Page) => {
  await page.evaluate(() => {
    const element = document.querySelector('[class="zombie-s"]');
    if (!element) return;
    element.remove()
  })
}

export const waitForNavHideDom = async () => {
  const page = scraper.page() as Page;
  
  await page.waitForNavigation({waitUntil: 'domcontentloaded'})
    .then(async () => {
      await page.evaluate(() => {
        const ol = document.createElement('div')
        ol.className = 'zombie-s'
        ol.style.cssText += 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:1000;background-color:black;pointer-events:none;display:flex;justify-content:center;align-items:center; font-size: 70%; color: white';
        ol.innerText = 'Please do not do anything until this message is gone'
        const dom = document.querySelector('html')
        if (!dom) return ;
        dom.insertBefore(ol, dom.firstChild)
      })
    })
}


export const loginThenVisit = async (account: IAccount, url: string) => {
  const page = scraper.page() as Page
  await scraper.visit(url)

  await page.waitForNavigation({timeout:10000})
    .then(async () => {
      if (page.url().includes('/#/login')) {
        await logIntoApollo(account);
        const cookies = await getBrowserCookies();
        await updateAccount(account._id, {cookie: JSON.stringify(cookies)});
        await scraper.visit(url)
      }
    })
}

// https://devforum.roblox.com/t/convert-1k-1m-1b-to-number/1505551

// local values = {
//   ["K"] = 1000;
//   ["M"] = 1000000;
//   ["B"] = 1000000000;
//   ["T"] = 1000000000000;
//   -- and so on... you can fill the rest in if you need to
// };

// local function AbrToNum(str: string)
//   local num, abr = str:match("^([%d.]+)(%a)$"); -- here we get the number and abbrevation from a string (case doesn't matter)
//   if num and abr then -- check if the string format is correct so nothing breaks
//       local val = values[abr:upper()]; -- get the value from 'values' table
//       if val then
//           return val * tonumber(num); -- if it exists then multiply number by value and return it
//       end
//   else
//       error("Invalid abbreviation");
//   end
// end



// local vals = {
//   --  V, Exponent
//     k = 3,   -- k = 1,000 // 10^exponent // 10^3 = 1,000
//     m = 6, -- m = 1,000,000 // 10^exponent // 10^6 = 1,000,000
//   }
  
//   -- func("1k") will return 1,000
//   return function(_abbr: string)
//           -- take the first part of the string, and the last part and separate them.
//     local num, lttr = tonumber(string.sub(_abbr, 1, -2)), string.sub(_abbr, -1)
//     return num * (10^vals[lttr]) -- multiply the number by the amount of 0's
//   end



// local function AbrevToNumber(nr_string)
// 	local number = string.gsub(nr_string, "%D", "")
// 	local abreviation = string.gsub(nr_string, "%d+", "")

// 	if abreviation == "M" then
// 		number *= 1000000
// 	end

// 	return number
// end

// print(AbrevToNumber("10M")) --// Should return 10000000






// var ranges = [
//   { divider: 1e18 , suffix: 'E' },
//   { divider: 1e15 , suffix: 'P' },
//   { divider: 1e12 , suffix: 'T' },
//   { divider: 1e9 , suffix: 'G' },
//   { divider: 1e6 , suffix: 'M' },
//   { divider: 1e3 , suffix: 'k' }
// ];

// function formatNumber(n) {
//   for (var i = 0; i < ranges.length; i++) {
//     if (n >= ranges[i].divider) {
//       return (n / ranges[i].divider).toString() + ranges[i].suffix;
//     }
//   }
//   return n.toString();
// }