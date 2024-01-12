import {
  scraper,
  apolloScrapePage,
  setupApolloForScraping,
  goToApolloSearchUrl, // edit
} from './scraper';
import {
  getBrowserCookies, wait_for_browser,
} from './util'
import {
  selectAccForScrapingFILO, selectProxy
} from "../database/util";
import useProxy from 'puppeteer-page-proxy';
import { Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import { IAccount } from '../database/models/accounts';
import { getAllApolloAccounts, initApolloSkeletonInDB, saveScrapeToDB } from '../database';

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

// (FIX) FINISH
export const apolloGetCookiesFromLogin = async (account: IAccount) => {
  if (!scraper.browser()) {
    await scraper.launchBrowser()
  }

  scraper.visit('https://app.apollo.io/#/login')

  const cookies = await wait_for_browser()
    .then(async () => {
      const client = await scraper.page()?.target().createCDPSession();
      const { cookies } = await client!.send('Network.getAllCookies');

      await scraper.close()

      return (cookies as unknown) as string[];
    });

    // await ------
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