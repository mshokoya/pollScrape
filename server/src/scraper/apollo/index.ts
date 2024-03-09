import {BrowserContext, scraper} from './scraper';
import {
  getBrowserCookies, logIntoApolloThenVisit
} from './util'
import {
  selectAccForScrapingFILO, selectProxy, totalLeadsScrapedInTimeFrame
} from "../../database/util";
import useProxy from 'puppeteer-page-proxy';
import { AccountModel, IAccount } from '../../database/models/accounts';
import { getAllApolloAccounts, saveScrapeToDB, updateAccount } from '../../database';
import { 
  apolloAddLeadsToListAndScrape,
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
import { MBEventArgs, accountToMailbox, mailbox } from '../../mailbox';
import { getApolloConfirmationLinksFromMail } from '../../mailbox/apollo';
import passwordGenerator  from 'generate-password';
import { io } from '../../websockets';
import { AppError, chuckRange, delay, generateSlug, getPageInApolloURL, getRangeFromApolloURL, setPageInApolloURL, setRangeInApolloURL } from '../../util';
import { IMetaData } from '../../database/models/metadata';


// (FIX) FINISH
export const logIntoApollo = async (taskID: string, browserCTX: BrowserContext, account: Partial<IAccount>) => {
  if (!account.email || !account.password || !account.loginType) throw new AppError(taskID, 'login details not provided')

  switch (account.loginType) {
    case 'default':
      await apolloDefaultLogin(taskID, browserCTX, account)
        .then(() => {  io.emit('apollo', {taskID, message: 'successfully logged into apollo via custom'}) })
      break;
    case 'outlook':
      await apolloOutlookLogin(taskID, browserCTX, account)
        .then(() => {  io.emit('apollo', {taskID, message: 'successfully logged into apollo via outlook'}) })
      break;
    case 'gmail':
      await apolloGmailLogin(taskID, browserCTX, account)
        .then(() => {  io.emit('apollo', {taskID, message: 'successfully logged into apollo via gmail'}) })
      break
    default:
      await apolloDefaultLogin(taskID, browserCTX, account)
        .then(() => {  io.emit('apollo', {taskID, message: 'successfully logged into apollo via custom'}) })
      break;
  }
}

export const signupForApollo = async (taskID: string, browserCTX: BrowserContext, account: Partial<IAccount>) => {
  if (!account.email || !account.password || !account.domain) throw new AppError(taskID, 'login details not provided')

  switch (account.domain) {
    case 'hotmail':
    case 'outlook':
      await apolloOutlookSignup(taskID, browserCTX, account)
        .then(() => {  io.emit('apollo', {taskID, message: 'successfully created apollo account'}) })
        .then(() => { updateAccount({domainEmail: account.domainEmail}, {verified: 'yes'}) })
      break;
    case 'gmail':
      await apolloGmailSignup(taskID, browserCTX, account)
        .then(() => {  io.emit('apollo', {taskID, message: 'successfully created apollo account'}) })
        .then(() => { updateAccount({domainEmail: account.domainEmail}, {verified: 'yes'}) })
      break
    default:
      await apolloDefaultSignup(taskID, browserCTX, account)
        .then(() => {  io.emit('apollo', {taskID, message: 'successfully created apollo account'}) })
        .then(() => { updateAccount({domainEmail: account.domainEmail}, {verified: 'confirm'}) })
      break;
  }
}

// (FIX) create manual login for custom domain
export const manuallyLogIntoApollo = async (taskID: string, browserCTX: BrowserContext, account: Partial<IAccount>) => {
  if (!account.email || !account.password || !account.domain) {
    throw new AppError(taskID, 'login details not provided')
  }

  switch (account.domain) {
    case 'hotmail':
    case 'outlook':
      await visitOutlookLoginAuthPortal(taskID, browserCTX, true)
        .then(() => {  io.emit('apollo', {taskID, message: 'navigated to outlook/hotmail auth portal'}) })
      break;
    case 'gmail':
      await visitGmailLoginAuthPortal(taskID, browserCTX, true)
        .then(() => {  io.emit('apollo', {taskID, message: 'navigated to gmail auth portal'}) })
      break
    default:
      break
  }
}

// (FIX) make sure not already upgraded
export const logIntoApolloAndUpgradeAccount = async (taskID: string, browserCTX: BrowserContext, account: IAccount) => {
  await logIntoApolloThenVisit(taskID, browserCTX, account, 'https://app.apollo.io/#/settings/plans/upgrade')
    .then(() => { io.emit('apollo', {taskID, message: 'navigated to the upgrade page'}) })

  return await upgradeApolloAccount(taskID, browserCTX)
    .then(_ => {
      io.emit('apollo', {taskID, message: 'upgraded account'})
      return _
    })
}

// (FIX) make sure not already upgraded
// (FIX) hide dom after upgrade so scraping credits process is hidden
export const logIntoApolloAndUpgradeAccountManually = async (taskID: string, browserCTX: BrowserContext, account: IAccount) => {
  const page = browserCTX.page

  await logIntoApolloThenVisit(taskID, browserCTX, account, 'https://app.apollo.io/#/settings/plans/upgrade/')
    .then(() => {  io.emit('apollo', {taskID, message: 'navigated to the upgrade page'}) })

  const creditsInfo = await page.waitForSelector('[class="zp_EanJu]"', {visible: true}) // trial days left in top nav bar
    .then(async () => {
      await logIntoApolloThenVisit(taskID, browserCTX, account, 'https://app.apollo.io/#/settings/credits/current')
        .then(() => { io.emit('apollo', {taskID, message: 'navigated to the credits page'}) })
      
        return await apolloGetCreditsInfo(taskID, browserCTX)
        .then(_ => {
          io.emit('apollo', { taskID, message: `obtained ${account.domainEmail} credits info`})
          return _
        })
    })
    .catch(() => null)
    if (!creditsInfo) throw new AppError(taskID, "Please check account, upgrade might've failed")

    return creditsInfo
}

export const logIntoApolloAndGetCreditsInfo = async (taskID: string, browserCTX: BrowserContext, account: IAccount) => {
  await logIntoApolloThenVisit(taskID, browserCTX, account, 'https://app.apollo.io/#/settings/credits/current')
    .then(() => io.emit('apollo', {taskID, message: 'navigated to the credits page'}));

  return await apolloGetCreditsInfo(taskID, browserCTX)
    .then( _ => {
      io.emit('apollo', {taskID, message: `successfully obtained ${account.domainEmail} credits info`});
      return _
    })
}

export const completeApolloAccountConfimation = async (taskID: string, browserCTX: BrowserContext, account: IAccount) => {
  
  await mailbox.getConnection(accountToMailbox(account))
    .then(() => io.emit('apollo', { taskID, message: 'started mailbox'}) );

  const allMail = await mailbox.getAllMail(account.email)
    .then(_ => { 
      io.emit('apollo', { taskID, message: 'got all mail'}); 
      return _
    });

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
      const links = await getApolloConfirmationLinksFromMail(mail)
        .then(_ => {
          io.emit('apollo', { taskID, message: 'got all mail'});
          return _
        });

      if (!links.length) throw new AppError(taskID, 'Failed to confirm apollo account, could not find confimation link')

      account.apolloPassword = passwordGenerator.generate({
        length: 20,
        numbers: true
      });

      await apolloConfirmAccount(taskID, browserCTX, links[0], account)
        .then(() => io.emit('apollo', { taskID, message: `confirmed account ${account.domainEmail}`}) )

      const cookies = await getBrowserCookies(browserCTX);
      const newAccount = await updateAccount(
        {domainEmail: toAddress}, 
        {
          cookie: JSON.stringify(cookies), 
          verified: 'yes', 
          apolloPassword: account.apolloPassword
        }
      );
      return newAccount
    } else {
      continue
    }
  }
}

// (FIX) need to figure out how to handle io for events
export const apolloConfirmAccountEvent = async (taskID: string, {aliasEmail, authEmail, count, prevCount}: MBEventArgs): Promise<void> => {
  if (count < prevCount) return;

  try {
    const mail = await mailbox.getLatestMessage(authEmail)
      .then(_ => {
        io.emit('apollo', { taskID, message: 'successfully obtained latest mail'})
        return _
      });

    const fromAddress = mail.envelope.from[0].address!
    const fromName = mail.envelope.from[0].name!
    const toAddress = mail.envelope.to[0].address?.trim()
    const uid = mail.uid

    if (
      !fromAddress.includes('apollo') && 
      !fromName.includes('apollo') &&
      toAddress !== aliasEmail
    ) { 
      io.emit('apollo', { taskID, message: 'Mail Event Failed'})
      // throw new Error("Failed to signup, could'nt find apollo email (name, address)") 
      return
    }

    const links = await getApolloConfirmationLinksFromMail(mail)
      .then( _ => {
        io.emit('apollo', { taskID, message: 'extracted the confirmation email'})
        return _
      });

    if (!links.length) throw new AppError(taskID, 'Failed to confirm apollo account, could not find confimation link')

    const account = await AccountModel.findOne({domainEmail: toAddress}).lean();
    if (!account) throw new AppError(taskID, 'Failed to find account (new mail)');

    account.apolloPassword = passwordGenerator.generate({
      length: 20,
      numbers: true
    });

    const browserCTX = (await scraper.newBrowser(false))!
    await apolloConfirmAccount(taskID, browserCTX, links[0], account)
      .then(() => io.emit('apollo', { taskID, message: `confirmed ${account.domainEmail}` }));
    const cookies = await getBrowserCookies(browserCTX);
    await scraper.close(browserCTX)
    await updateAccount(
      {domainEmail: toAddress}, 
      {
        cookie: JSON.stringify(cookies), 
        verified: 'yes',
        apolloPassword: account.apolloPassword
      }
    );
    console.log('heeemail id')
    console.log(mail.emailId)
    await mailbox.deleteMailByID(authEmail, uid)
  } catch (err: any) {
    io.emit('apollo', { taskID, message: err.message, ok: false })
  }
}

export const apolloScrape = async (taskID: string, browserCTX: BrowserContext, meta: IMetaData, usingProxy: boolean) => {
  const employeeRange = getRangeFromApolloURL(meta.url)
  if (employeeRange.length > 1) throw new AppError(taskID, 'can only have one range set');
  const employeeRangeMin = parseInt(employeeRange[0][0])
  const employeeRangeMax = parseInt(employeeRange[0][1])

  // (FIX) low ranges may fuckup - make parts dynamic
  const rng = chuckRange(employeeRangeMin, employeeRangeMax, 3)

  // (FIX) if one promise fails, all fail immediatly https://dmitripavlutin.com/promise-all/
  await Promise.all([ssa(taskID, browserCTX, meta, usingProxy, rng[0])])
}


type SAccount = IAccount & { totalScrapedInLast30Mins: number }
// (FIX) find a way to select account not in use (since you can scrape multiple at once), maybe have a global object/list that keeps track of accounts in use
export const ssa = async (
  taskID: string, 
  browserCTX: BrowserContext,
  meta: IMetaData, 
  usingProxy: boolean,
  range: [number, number]
  ) => {
  let proxy: string | null = null;
  let account: SAccount;
  const maxLeadScrapeLimit = 1000 // max amount of leads 1 account can scrape before protentially 24hr ban
  const maxLeadsOnPage = 25 // apollo has 25 leads per page MAX

  
  const acc4Scrape = meta.accounts.find(
    a => ( (a.range[0] === range[0]) && (a.range[1] === range[1]) )
  )

  if (!acc4Scrape) {
    account = (await selectAccForScrapingFILO(1))[0]

    if (!account) throw new AppError(taskID, 'failed to find account for scraping') 
    if (account.totalScrapedInLast30Mins === undefined || account.totalScrapedInLast30Mins >= maxLeadScrapeLimit) return
  } else {
    let acc = await AccountModel.findById(acc4Scrape.accountID).lean() as SAccount;
    if (!acc) { 
      acc = (await selectAccForScrapingFILO(1))[0] 
      if (!acc) throw new AppError(taskID, 'failed to find account for scraping')
    } else {
      !acc.history.length 
        ? (acc.totalScrapedInLast30Mins = 0) : ( acc.totalScrapedInLast30Mins = totalLeadsScrapedInTimeFrame(acc))
    }
    if (acc.totalScrapedInLast30Mins === undefined || acc.totalScrapedInLast30Mins >= maxLeadScrapeLimit) return
    account = acc
  }

  if (usingProxy) {
    // (FIX) if proxy does not work assign new proxy & save to db, if no proxy use default IP (or give user a choice)
    proxy =  await selectProxy(account);
    if (!proxy) throw new AppError(taskID, `failed to use proxy`);
    const page = browserCTX.page;
    await useProxy(page, proxy)
      .then(() => { io.emit('apollo', {taskID, message: 'added proxy to page'}) });
  }

  await setupApolloForScraping(taskID, browserCTX, account)
    .then(() => { io.emit('apollo', {taskID, message: 'successfully setup apollo for scraping'}) })
  let url = setRangeInApolloURL(meta.url, range)
  url = setPageInApolloURL(url, 1)
  let credits = await logIntoApolloAndGetCreditsInfo(taskID, browserCTX, account)

  // (FIX) make sure this works
  const apolloMaxPage = ['gmail', 'hotmail', 'outlook'].includes(account.domain) ? 3 : 5

  // while (true) {
    const creditsLeft =  credits.emailCreditsLimit - credits.emailCreditsUsed
    if (creditsLeft <= 0) throw new Error('fail 1');

    const numOfLeadsAccCanScrape =  maxLeadScrapeLimit - account.totalScrapedInLast30Mins
    if (numOfLeadsAccCanScrape <= 0) throw new Error('fail 2');
    const b = Math.min(numOfLeadsAccCanScrape, creditsLeft)
    const limit = (b >=  maxLeadsOnPage) ?  maxLeadsOnPage : b

    // go to scrape link
    await goToApolloSearchUrl(taskID, browserCTX, url)
      .then(() => { io.emit('apollo', {taskID, message: 'visiting apollo lead url'}) })

    const listName = generateSlug(4)
    const data = await apolloAddLeadsToListAndScrape(taskID, browserCTX, limit, listName) // edit
      .then(_ => {  
        io.emit('apollo', {taskID, message: 'successfully scraped page'}) 
        return _
      })
    
    if (!data || !data.length) return 

    delay(3000) // randomise between 3 - 5
    
    const newCredits = await logIntoApolloAndGetCreditsInfo(taskID, browserCTX, account)
    const cookies = await getBrowserCookies(browserCTX);
    const totalScraped = newCredits.emailCreditsUsed - credits.emailCreditsUsed;
    account.totalScrapedInLast30Mins = account.totalScrapedInLast30Mins + totalScraped
    account.history.push([totalScraped, new Date().getTime()])

    const nextPage = getPageInApolloURL(url) + 1
    url = setPageInApolloURL(url, (nextPage > apolloMaxPage) ? 1 : nextPage)

    // (FIX) acc4Scrape & its range needs to be saved in db
    await saveScrapeToDB(taskID, account, meta, newCredits, cookies, listName, range, data, proxy)
      .then(() => {  io.emit('apollo', {taskID, message: 'saved leads to database'}) });
  // }
}




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