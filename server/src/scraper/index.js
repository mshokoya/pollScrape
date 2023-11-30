import {
  scraper,
  apolloLogin,
  visitGoogle,
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
  initApolloSkeletonInDB
} from '../db/actions';
import useProxy from 'puppeteer-page-proxy';


const startApollo = async (scraper, cookies, email, pass) => {
  const s = scraper();
  const p = s.page();

  await visitGoogle(s);
  await setBrowserCookies(p, cookies);
  await visitApollo(s);

  const pageUrl = p.url()
  
  if (pageUrl.includes(apolloLoggedOutURLSubstr)) {
    await apolloLogin(s, email, pass)
  } 
}


//TODO work on page changing
//TODO get cookies from db an add to browser
//TODO proxy rotation
// start apollo should use url
const startScraping = (scraper, socket, db, browserConf) => async (url) => {
  // for both methods, if does not exist (url *without page query* cannot be found) then create skelenton in db
  await initApolloSkeletonInDB(url)

  for (let link of urlList) {
    const p = scraper.page();

    const allUsers = await db.account.getAllUses();
    const user = selectAccForScrapingFILO(allUsers);

    const proxy = browserConf.proxies.getProxy(user);

    await useProxy(p, proxy);

    await startApollo(scraper, user.cookies); 
    await goToApolloSearchUrl(scraper, link);
    const data = await apolloScrapePage(scraper);

    const cookies = await getBrowserCookies(p);

    await savePageScrapeToDB(user._id, cookies);

    await useProxy(p, null);
  }

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