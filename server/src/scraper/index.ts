import {BrowserContext, scraper} from './scraper';
import {
  getBrowserCookies, logIntoApolloThenVisit
} from './util'
import {
  selectAccForScrapingFILO, selectProxy
} from "../database/util";
import useProxy from 'puppeteer-page-proxy';
import { AccountModel, IAccount } from '../database/models/accounts';
import { getAllApolloAccounts, saveScrapeToDB, updateAccount } from '../database';
import { 
  apolloConfirmAccount, 
  apolloDefaultLogin, 
  apolloDefaultSignup, 
  apolloGetCreditsInfo, 
  apolloStartPageScrape, 
  goToApolloSearchUrl, 
  setupApolloForScraping, 
  upgradeApolloAccount 
} from './apollo';
import { apolloOutlookLogin, apolloOutlookSignup, visitOutlookLoginAuthPortal } from './outlook';
import { apolloGmailLogin, apolloGmailSignup, visitGmailLoginAuthPortal } from './gmail';
import { MBEventArgs, accountToMailbox, mailbox } from '../mailbox';
import { getApolloConfirmationLinksFromMail } from '../mailbox/apollo';
import passwordGenerator  from 'generate-password';

// start apollo should use url
// TODO
// handle account failed login
export const startScrapingApollo = async (taskID: string, browserCTX: BrowserContext, metaID: string, url: string, usingProxy: boolean) => {
  let proxy: string | null = null;

  const allAccounts = await getAllApolloAccounts()

  if (!allAccounts) throw new Error('No account for scraping, please create new apollo accounts for scraping (ideally 20-30)')
  if (allAccounts.length < 15) {
    console.warn('Send a waring via websockets. should have at least 15 to prevent accounts from getting locked for 10 days');
  }
  
  const account = selectAccForScrapingFILO(allAccounts);

  if (usingProxy) {
    proxy =  await selectProxy(account, allAccounts);
    if (!proxy) throw new Error(`failed to use proxy`);
    const page = browserCTX.page;
    await useProxy(page, proxy);
  }

  await setupApolloForScraping(taskID, browserCTX, account);
  await goToApolloSearchUrl(taskID, browserCTX, url);

  const data = await apolloStartPageScrape(taskID, browserCTX); // edit
  const cookies = await getBrowserCookies(browserCTX);

  await saveScrapeToDB(account._id, cookies, url, data, metaID, proxy);
}

// (FIX) FINISH
export const logIntoApollo = async (taskID: string, browserCTX: BrowserContext, account: Partial<IAccount>) => {
  if (!account.email || !account.password || !account.loginType) {
    throw new Error('login details not provided')
  }

  switch (account.loginType) {
    case 'default':
      await apolloDefaultLogin(taskID, browserCTX, account)
      break;
    case 'outlook':
      await apolloOutlookLogin(taskID, browserCTX, account)
      break;
    case 'gmail':
      await apolloGmailLogin(taskID, browserCTX, account)
      break
    default:
      await apolloDefaultLogin(taskID, browserCTX, account)
      break;
  }
}

export const signupForApollo = async (taskID: string, browserCTX: BrowserContext, account: Partial<IAccount>) => {
  if (!account.email || !account.password || !account.domain) throw new Error('login details not provided')

  switch (account.domain) {
    case 'hotmail':
    case 'outlook':
      await apolloOutlookSignup(taskID, browserCTX, account)
      break;
    case 'gmail':
      await apolloGmailSignup(taskID, browserCTX, account)
      break
    default:
      await apolloDefaultSignup(taskID, browserCTX, account)
      break;
  }
}

// (FIX) create manual login for custom domain
export const manuallyLogIntoApollo = async (taskID: string, browserCTX: BrowserContext, account: Partial<IAccount>) => {
  if (!account.email || !account.password || !account.domain) {
    throw new Error('login details not provided')
  }

  switch (account.domain) {
    case 'hotmail':
    case 'outlook':
      await visitOutlookLoginAuthPortal(taskID, browserCTX, true)
      break;
    case 'gmail':
      await visitGmailLoginAuthPortal(taskID, browserCTX, true)
      break
    default:
      break
  }
}

// (FIX) make sure not already upgraded
export const logIntoApolloAndUpgradeAccount = async (taskID: string, browserCTX: BrowserContext, account: IAccount) => {
  await logIntoApolloThenVisit(taskID, browserCTX, account, 'https://app.apollo.io/#/settings/plans/upgrade')
  return await upgradeApolloAccount(taskID, browserCTX)
}

// (FIX) make sure not already upgraded
// (FIX) hide dom after upgrade so scraping credits process is hidden
export const logIntoApolloAndUpgradeAccountManually = async (taskID: string, browserCTX: BrowserContext, account: IAccount) => {
  const page = browserCTX.page

  await logIntoApolloThenVisit(taskID, browserCTX, account, 'https://app.apollo.io/#/settings/plans/upgrade/')
  const creditsInfo = await page.waitForSelector('[class="zp_EanJu]"', {visible: true}) // trial days left in top nav bar
    .then(async () => {
      await logIntoApolloThenVisit(taskID, browserCTX, account, 'https://app.apollo.io/#/settings/credits/current')
      return await apolloGetCreditsInfo(taskID, browserCTX)
    })
    .catch(() => null)
    if (!creditsInfo) throw new Error("Please check account, upgrade might've failed")

    return creditsInfo
}

export const logIntoApolloAndGetCreditsInfo = async (taskID: string, browserCTX: BrowserContext, account: IAccount) => {
  await logIntoApolloThenVisit(taskID, browserCTX, account, 'https://app.apollo.io/#/settings/credits/current')
  return await apolloGetCreditsInfo(taskID, browserCTX)
}

export const completeApolloAccountConfimation = async (taskID: string, browserCTX: BrowserContext, account: IAccount) => {
  await mailbox.getConnection(accountToMailbox(account))
  const allMail = await mailbox.getAllMail(account.email)

  for (let mail of allMail) {
    const toAddress = mail.envelope.to[0].address?.trim()
    const fromAddress = mail.envelope.from[0].address
    const fromName = mail.envelope.from[0].name
    if (
      toAddress === account.domainEmail &&
      (
        fromAddress?.includes('apollo') ||
        fromName?.includes('apollo')
      )
    ) {
      const links = await getApolloConfirmationLinksFromMail(mail);
      if (!links.length) throw new Error('Failed to confirm apollo account, could not find confimation link')

      account.apolloPassword = passwordGenerator.generate({
        length: 20,
        numbers: true
      });

      await apolloConfirmAccount(taskID, browserCTX, links[0], account)

      const cookies = await getBrowserCookies(browserCTX);
      const newAccount = await updateAccount(
        {domainEmail: toAddress}, 
        {
          cookie: JSON.stringify(cookies), 
          verified: true, 
          apolloPassword: account.apolloPassword
        }
      );
      return newAccount
    } else {
      continue
    }
  }
}

export const apolloConfirmAccountEvent = async (taskID: string, {authEmail, count, prevCount}: MBEventArgs): Promise<void> => {
  if (count < prevCount) return;

  const mail = await mailbox.getLatestMessage(authEmail);
  const fromAddress = mail.envelope.from[0].address!
  const fromName = mail.envelope.from[0].name!
  const toAddress = mail.envelope.to[0].address?.trim()

  if (
    !fromAddress.includes('apollo') && 
    !fromName.includes('apollo')
  ) { 
    // throw new Error("Failed to signup, could'nt find apollo email (name, address)") 
    return
  }

  const links = await getApolloConfirmationLinksFromMail(mail);
  if (!links.length) throw new Error('Failed to confirm apollo account, could not find confimation link')

  const account = await AccountModel.findOne({domainEmail: toAddress}).lean();
  if (!account) throw new Error('Failed to find account (new mail)');

  account.apolloPassword = passwordGenerator.generate({
    length: 20,
    numbers: true
  });

  const browserCTX = await scraper.newBrowser(false)
  await apolloConfirmAccount(taskID, browserCTX, links[0], account);
  const cookies = await getBrowserCookies(browserCTX);
  await scraper.close(browserCTX)
  await updateAccount(
    {domainEmail: toAddress}, 
    {
      cookie: JSON.stringify(cookies), 
      verified: true,
      apolloPassword: account.apolloPassword
    }
  );
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