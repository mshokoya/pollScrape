import {
  scraper,
  apolloLogin,
  goToApolloSearchUrl,
  apolloScrapePage,
  visitApollo
} from './scraper';
import {
  getBrowserCookies,
  setBrowserCookies,
  visitGoogle,
  apolloLoggedOutURLSubstr
} from './util'
import {
  selectAccForScrapingFILO
} from "../db/util";
import {
  savePageScrapeToDB,
  initApolloSkeletonInDB,
  getAllApolloAccounts,
  selectProxy,
} from '../db/actions';
import useProxy from 'puppeteer-page-proxy';


const setupApollo = async (scraper, account) => {
  const s = scraper();
  const p = s.page();

  await visitGoogle(s);
  await setBrowserCookies(p, account.cookies); // needs work (cookest from string to array)
  await visitApollo(s);

  const pageUrl = p.url();
  
  // check if logged in via url
  if (pageUrl.includes(apolloLoggedOutURLSubstr)) {
    await apolloLogin(s, account.apollo.email, account.apollo.password)
  } 
}


// start apollo should use url
export const startScrapingApollo = (scraper, socket) => async (urlList) => {
  for (let url of urlList) {
    scraper.restartBrowser();
    const p = scraper.page();

    await initApolloSkeletonInDB(url);

    const allUsers = await getAllApolloAccounts();
    const account = selectAccForScrapingFILO(allUsers);
    const proxy =  await selectProxy(account, allAccounts);

    await useProxy(p, proxy);
    await setupApollo(scraper, account); 
    await goToApolloSearchUrl(scraper, url);

    const data = await apolloScrapePage(scraper);
    const cookies = await getBrowserCookies(p);

    await savePageScrapeToDB(account._id, cookies, proxy, url, data);
  }

  scraper.close();

  //loop
    // reset browser (delete all cookies, go to google, change ip)
    // from db get all apollo accs & select the 
    // startApollo(scraper, cookies, email, pass)
    // visit page
    // check the amount of leads
    // check the amount of paginations
    // wait for table to render
    // scrape table
    // change page number in db
    // update time last used
    // close browser or reset browser?
    // repeat
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