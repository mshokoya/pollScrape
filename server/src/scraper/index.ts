import {
  scraper,
  apolloStartPageScrape,
  setupApolloForScraping,
  goToApolloSearchUrl, // edit
} from './scraper';
import {
  delay,
  getBrowserCookies, waitForApolloLogin
} from './util'
import {
  selectAccForScrapingFILO, selectProxy
} from "../database/util";
import useProxy from 'puppeteer-page-proxy';
import { Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import { IAccount } from '../database/models/accounts';
import { addCookiesToAccount, getAllApolloAccounts, saveScrapeToDB } from '../database';

const checkUserIP = async () => {
  const s = scraper;
  const p = s.page();

  const page = await scraper.visit('https://whatismyipaddress.com')
  await page.waitForTimeout(5000)
}

// start apollo should use url
// TODO
// handle account failed login
export const startScrapingApollo = async (metaID: string, urlList: string[], usingProxy: boolean) => {

  for (let url of urlList) {
    let proxy: string | null;

    const browser = await scraper.restartBrowser()
      .then(() => {
        console.log('started browser')
      })

    const allAccounts = await getAllApolloAccounts()

    if (!allAccounts) throw new Error('No account for scraping, please create new apollo accounts for scraping (ideally 20-30)')
    if (allAccounts.length < 15) {
      // (WARN)
      console.log('Send a waring via websockets. should have at least 15 to prevent accounts from getting locked for 10 days');
    }
    
    const account = selectAccForScrapingFILO(allAccounts);

    if (usingProxy) {
      proxy =  await selectProxy(account, allAccounts);
      if (!proxy) throw new Error(`failed to use proxy `)
        const page = scraper.page() as Page;
        await useProxy(page, proxy);
    }

    console.log('account')
    console.log(account)

    await setupApolloForScraping(account);
    await goToApolloSearchUrl(url);
    const data = await  apolloStartPageScrape(); // edit
    const cookies = await getBrowserCookies();

    // @ts-ignore
    await saveScrapeToDB(account._id, cookies, url, data, metaID, proxy);
  }

  await scraper.close();
}

// (FIX): need to impliment proxies // sort out inital login popups (look for close button)
export const apolloGetCookiesFromLogin = async (account: IAccount): Promise<IAccount> => {
  await setupApolloForScraping(account)

  const cookie = await waitForApolloLogin()
    .then(async () => {
      const cookies = await getBrowserCookies()

      await scraper.close()

      return (cookies as unknown) as string[];
    })
    .catch(() => {
      return null
    })

  if (cookie) {

    const newAccount = await addCookiesToAccount(account._id, cookie)

    if (!newAccount) throw new Error('failed to login (save cookies)');

    return newAccount
    
  } else {
    throw new Error('failed to login (cookies)')
  }
}


// we need to get format of cookies (all & apollo seprate) manually login on browser, extract cookies and add to app cookies
//remeber to check

// page
// &page=1

// name sort
// &sortByField=person_name.raw&sortAscending=false
// &sortByField=person_name.raw&sortAscending=true

// title sort
// &sortByField=person_title_normalized&sortAscending=true
// &sortByField=person_title_normalized&sortAscending=false

// company
// &sortByField=sanitized_organization_name_unanalyzed&sortAscending=true
// &sortByField=sanitized_organization_name_unanalyzed&sortAscending=false

// employees
// &sortByField=organization_estimated_number_employees&sortAscending=true
// &sortByField=organization_estimated_number_employees&sortAscending=false

// phone
// &sortByField=person_phone&sortAscending=true
// &sortByField=person_phone&sortAscending=false

// industry
// &sortByField=organization_linkedin_industry_tag_ids&sortAscending=true
// &sortByField=organization_linkedin_industry_tag_ids&sortAscending=false

// range
// &organizationNumEmployeesRanges[]=1%2C10
// &organizationNumEmployeesRanges[]=%2C1
// &organizationNumEmployeesRanges[]=6%2C67
// &organizationNumEmployeesRanges[]=6%2C1000000

// 25 rows per table

// 100 max pages





//  ONE POPUP 
// Would you like Apollo to let you know when buyers search for companies like yours?
// class="zp-button zp_zUY3r zp_MCSwB zp_iNK2i"
// type="button"


// TWO POPUP
// Hit 25% higher response rates

// checkout
// <div role='dialog' class='apolloio-css-vars-reset zp zp-modal zp_iDDtd' aria-hidden='true' />

// also 

// apolloio-css-vars-reset zp_xfGlC

// also

// close icon 
// zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_rzbAy zp_cuqpV      (it is only child of dialog popup)