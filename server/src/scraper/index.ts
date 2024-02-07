import {scraper} from './scraper';
import {
  getBrowserCookies, logIntoApolloThenVisit
} from './util'
import {
  selectAccForScrapingFILO, selectProxy
} from "../database/util";
import useProxy from 'puppeteer-page-proxy';
import { Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import { AccountModel, IAccount } from '../database/models/accounts';
import { getAllApolloAccounts, saveScrapeToDB, updateAccount } from '../database';
import { apolloConfirmAccount, apolloDefaultLogin, apolloDefaultSignup, apolloGetCreditsInfo, apolloStartPageScrape, goToApolloSearchUrl, setupApolloForScraping, upgradeApolloAccount } from './apollo';
import { apolloOutlookLogin, apolloOutlookSignup, visitOutlookLoginAuthPortal } from './outlook';
import { apolloGmailLogin, apolloGmailSignup, visitGmailLoginAuthPortal } from './gmail';
import { MBEventArgs, mailbox } from '../mailbox';
import { simpleParser } from 'mailparser';

const checkUserIP = async () => {
  const s = scraper;
  const p = s.page();

  const page = await scraper.visit('https://whatismyipaddress.com')
  await page.waitForTimeout(5000)
}

// start apollo should use url
// TODO
// handle account failed login
export const startScrapingApollo = async (metaID: string, url: string, usingProxy: boolean) => {
  let proxy: string | null = null;

  await scraper.restartBrowser()

  const allAccounts = await getAllApolloAccounts()

  if (!allAccounts) throw new Error('No account for scraping, please create new apollo accounts for scraping (ideally 20-30)')
  if (allAccounts.length < 15) {
    console.warn('Send a waring via websockets. should have at least 15 to prevent accounts from getting locked for 10 days');
  }
  
  const account = selectAccForScrapingFILO(allAccounts);

  if (usingProxy) {
    proxy =  await selectProxy(account, allAccounts);
    if (!proxy) throw new Error(`failed to use proxy`);
    const page = scraper.page() as Page;
    await useProxy(page, proxy);
  }

  await setupApolloForScraping(account);
  await goToApolloSearchUrl(url);

  const data = await apolloStartPageScrape(); // edit
  const cookies = await getBrowserCookies();

  await saveScrapeToDB(account._id, cookies, url, data, metaID, proxy);

  await scraper.close();
}

// (FIX) FINISH
export const logIntoApollo = async (account: Partial<IAccount>) => {
  if (!account.email || !account.password || !account.loginType) {
    throw new Error('login details not provided')
  }

  switch (account.loginType) {
    case 'default':
      await apolloDefaultLogin(account)
      break;
    case 'outlook':
      await apolloOutlookLogin(account)
      break;
    case 'gmail':
      await apolloGmailLogin(account)
      break
    default:
      await apolloDefaultLogin(account)
      break;
  }
}

export const signupForApollo = async (account: Partial<IAccount>) => {
  if (!account.email || !account.password || !account.domain) {
    throw new Error('login details not provided')
  }

  switch (account.domain) {
    case 'hotmail':
    case 'outlook':
      await apolloOutlookSignup(account)
      break;
    case 'gmail':
      await apolloGmailSignup(account)
      break
    default:
      await apolloDefaultSignup(account)
      break;
  }
}

// (FIX) create manual login for custom domain
export const manuallyLogIntoApollo = async (account: Partial<IAccount>) => {
  if (!account.email || !account.password || !account.domain) {
    throw new Error('login details not provided')
  }

  switch (account.domain) {
    case 'hotmail':
    case 'outlook':
      await visitOutlookLoginAuthPortal(true)
      break;
    case 'gmail':
      await visitGmailLoginAuthPortal(true)
      break
    default:
      break
  }
}

// (FIX) make sure not already upgraded
export const logIntoApolloAndUpgradeAccount = async (account: IAccount) => {
  const page = scraper.page() as Page

  await logIntoApolloThenVisit(account, 'app.apollo.io/#/settings/plans/upgrade')
  return await upgradeApolloAccount()
}

// (FIX) make sure not already upgraded
// (FIX) hide dom after upgrade so scraping credits process is hidden
export const logIntoApolloAndUpgradeAccountManually = async (account: IAccount) => {
  const page = scraper.page() as Page

  await logIntoApolloThenVisit(account, 'app.apollo.io/#/settings/plans/upgrade/')
  const creditsInfo = await page.waitForSelector('[class="zp_EanJu]"', {visible: true}) // trial days left in top nav bar
    .then(async () => {
      await logIntoApolloThenVisit(account, 'app.apollo.io/#/settings/credits/current')
      return await apolloGetCreditsInfo()
    })
    .catch(() => null)
    if (!creditsInfo) throw new Error("Please check account, upgrade might've failed")

    return creditsInfo
}

export const logIntoApolloAndGetCreditsInfo = async (account: IAccount) => {
  const page = scraper.page() as Page
  
  await logIntoApolloThenVisit(account, 'app.apollo.io/#/settings/credits/current')
  return await apolloGetCreditsInfo()
}

export const newMailEvent = async ({authEmail, count, prevCount}: MBEventArgs) => {
  if (count < prevCount) return;

  const mail = await mailbox.getLatestMessage(authEmail);
  const fromAddress = mail.envelope.from[0].address!
  const fromName = mail.envelope.from[0].name!
  const toAddress = mail.envelope.to[0].address

  if (
    !fromAddress.includes('apollo') && 
    !fromName.includes('apollo')
  ) { 
    throw new Error("Failed to signup, could'nt find apollo email (name, address)") 
  }

  const message = Buffer.from(mail.source);
  const parsedData = await simpleParser(message);
  
  const al1 = parsedData.text?.match(/(?<=Activate Your Account \( )[\S|\n]+/g)
  const al2 = parsedData.text?.match(/(?<=Or paste this link into your browser: )[\S|\n]+(?= \()/g)

  for (let link of [al1, al2]) {
    if (!link) continue;
    const l = link[0]
      .replace('\n', '')
      .replace('\r', '')

    const account = await AccountModel.findOne({domainEmail: toAddress?.trim()}).lean();
    if (!account) throw new Error('Failed to find account (new mail)');

    await apolloConfirmAccount(l, account);
    const cookies = await getBrowserCookies();
    await updateAccount({domainEmail: toAddress?.trim()}, {cookie: JSON.stringify(cookies)});

    break;
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