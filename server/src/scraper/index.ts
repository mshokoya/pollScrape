import {
  scraper,
  apolloScrapePage,
  setupApolloForScraping,
  goToApolloSearchUrl, // edit
} from './scraper';
import {
  getBrowserCookies, waitForApolloLogin
} from './util'
import {
  selectAccForScrapingFILO, selectProxy
} from "../database/util";
import useProxy from 'puppeteer-page-proxy';
import { Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import { AccountModel, IAccount } from '../database/models/accounts';
import { addCookiesToAccount, getAllApolloAccounts, initApolloSkeletonInDB, saveScrapeToDB } from '../database';

const checkUserIP = async () => {
  const s = scraper;
  const p = s.page();

  const page = await scraper.visit('https://whatismyipaddress.com')
  await page.waitForTimeout(5000)
}

// start apollo should use url
// TODO
// handle account failed login
export const startScrapingApollo = async (urlList: string[], usingProxy: boolean) => {

  for (let url of urlList) {
    await scraper.restartBrowser();
    const page = scraper.page() as Page;

    await initApolloSkeletonInDB(url);

    const allAccounts = await getAllApolloAccounts();
    if (!allAccounts) throw new Error('No account for scraping, please create new apollo accounts for scraping (ideally 20-30)')
    if (allAccounts.length < 15) {
      // (WARN)
      console.log('Send a waring via websockets. should have at least 15 to prevent accounts from getting locked for 10 days');
    }
    
    const account = selectAccForScrapingFILO(allAccounts);

    if (usingProxy) {
      const proxy =  await selectProxy(account, allAccounts);
      if (proxy) {
        await useProxy(page, proxy);
      }
    }

    await setupApolloForScraping(account);
    await goToApolloSearchUrl(url);
    const data = await apolloScrapePage(); // edit
    const cookies = await getBrowserCookies(page);

    // @ts-ignore
    await saveScrapeToDB(account._id, cookies, proxy, url, data);
  }

  await scraper.close();
}

// (FIX): need to impliment proxies // sort out inital login popups (look for close button)
export const apolloGetCookiesFromLogin = async (account: IAccount): Promise<IAccount> => {
  if (!scraper.browser()) {
    await scraper.launchBrowser()
  }

  const loginInputFieldSelector = '[class="zp_bWS5y zp_J0MYa"]' // [email, password]
  const loginButtonSelector = '[class="zp-button zp_zUY3r zp_H_wRH"]'

  scraper.visit('https://app.apollo.io/#/login')
  const page = scraper.page()
  await page?.waitForSelector(loginInputFieldSelector, {visible: true})
  const submitButton = await page?.waitForSelector(loginButtonSelector, {visible: true})
  const login = await page?.$$(loginInputFieldSelector)

  if (!login || !submitButton) throw new Error('failed to login');

  await login[0].type(account.email)
  await login[1].type(account.password)

  await submitButton?.click()

  
  // route hit on login - https://app.apollo.io/#/onboarding-hub/queue


  // error incorrect login --- zp_nFR11
  // error empty fields --- error-label zp_HeV9x

  // icons parent div --- zp_RB9tu zp_0_HyN
  // icon --- zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_rzbAy

  const cookie = await waitForApolloLogin()
    .then(async () => {
      const client = await scraper.page()?.target().createCDPSession();
      const { cookies } = await client!.send('Network.getAllCookies');

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