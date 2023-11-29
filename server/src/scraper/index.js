// import {

// } from './apollo';
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
  apolloLoggedInURLSubstr,
  apolloLoggedOutURLSubstr
} from './util'


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

const startScrape = (scraper, socket, db) => async (url) => {
  // visit page
  // check the amount of leads
  // check the amount of paginations
  // wait for table to render
  // scrape table
  // change page number in db
  // close browser
  // repeat
  scraper.
}


// we need to get format of cookies (all & apollo seprate) manually login on browser, extract cookies and add to app cookies
//remeber to check