import { logIntoApollo } from ".";
import { addCookiesToAccount } from "../database";
import { IAccount } from "../database/models/accounts";
import { IRecord } from "../database/models/records";
import { apolloDoc } from "./dom/scrapeData";
import { apolloGmailLogin, apolloGmailSignup } from "./gmail";
import { apolloOutlookLogin, apolloOutlookSignup } from "./outlook";
import { scraper } from "./scraper";
import { apolloLoggedOutURLSubstr, apolloTableRowSelector, delay, getBrowserCookies, injectCookies } from "./util";
import { Page } from 'puppeteer-extra-plugin/dist/puppeteer';

type Upgrade = {
  plan: string
  trialEnd: string
  credits: {
    used: string
    limit: string
  }
}

// (WARN) this is for automation page update
export const apolloUpdatePageQueryString = (url: string) => {
  const myURL = new URL(url);
  const pageNum = myURL.searchParams.get('page') as string;

  if (pageNum) {
    myURL.searchParams.set('page', `${parseInt(pageNum)+1}`)
  } else {
    myURL.searchParams.set('page', '2')
  }

  return myURL.href;
}

export const visitApollo = async () => {
  const page = await scraper.visit("https://app.apollo.io");
  await page.waitForSelector(".zp_bWS5y, .zp_J0MYa", { visible: true });
}

export const visitApolloLoginPage = async () => {
  const page = await scraper.visit('https://app.apollo.io/#/login')
  await page.waitForSelector('input[class="zp_bWS5y zp_J0MYa"][name="email"]', { visible: true });
}

export const goToApolloSearchUrl = async (apolloSearchURL: string) => {
  const page = await scraper.visit(apolloSearchURL);
  await page.waitForSelector(apolloTableRowSelector, { visible: true });
}

export const apolloStartPageScrape = async () => {
  const page = scraper.page() as Page
  const data = (await apolloDoc(page) as unknown) as IRecord[];
  return data;
}



export const apolloDefaultLogin = async (account: Partial<IAccount>) => {
  const loginInputFieldSelector = '[class="zp_bWS5y zp_J0MYa"]' // [email, password]
  const loginButtonSelector = '[class="zp-button zp_zUY3r zp_H_wRH"]'
  const incorrectLoginSelector = '[class="zp_nFR11"]'
  const emptyFieldsSelector = '[class="error-label zp_HeV9x"]'
  const popupSelector = '[class="zp_RB9tu zp_0_HyN"]'
  const popupCloseButtonSelector = '[class="zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_rzbAy"]'
  const page = scraper.page() as Page

  if (!account.email || !account.password) throw new Error('failed to login, credentials missing');
  
  if (!page.url().includes(apolloLoggedOutURLSubstr)) {
    await visitApolloLoginPage()
  }

  const submitButton = await page?.waitForSelector(loginButtonSelector, {visible: true})
  const login = await page?.$$(loginInputFieldSelector)

  if (!login || !submitButton) throw new Error('failed to login');

  await login[0].type(account.email)
  await login[1].type(account.password)

  await submitButton?.click()
  // route hit on login - https://app.apollo.io/#/onboarding-hub/queue

  await delay(2000)

  const incorrectLogin = await page.$(incorrectLoginSelector)
  const emptyFields = await page.$(emptyFieldsSelector)

  if (incorrectLogin) {
    throw Error('failed to login, incorrect login details, please make sure login details are correct by manually logging in')
  } else if (emptyFields) {
    throw Error('failed to login, email or password field empty, please update account details with corrent details')
  }

  await delay(2000)

  if (page.url().includes('#/login')) {
    throw new Error('failed to login, could not navigate to dashboard, please login manually and make sure login details are correct and working')
  }
}

export const setupApolloForScraping = async (account: IAccount) => {
  await injectCookies(account.cookie)
  await visitApollo();

  const page = scraper.page() as Page;
  const pageUrl = page.url();
  
  // check if logged in via url
  if (pageUrl.includes(apolloLoggedOutURLSubstr)) {
    logIntoApollo(account)
    const cookies = await getBrowserCookies()
    await addCookiesToAccount(account._id, cookies)
  } 
}


export const apolloGetCreditsInfo = async (): Promise<string[]> => {
  const page = scraper.page() as Page
  await scraper.visit('app.apollo.io/#/settings/credits/current')
  const creditSelector = await page!.waitForSelector('div[class="zp_ajv0U"]', {visible: true, timeout: 10000})
  if (!creditSelector) throw new Error('failed to get credit limit')

  const creditStr = await page.evaluate(() => {
    const e = document.querySelector('div[class="zp_ajv0U"]')
    // @ts-ignore
    return e ? e.innerText : null
  })

  if (!creditStr) throw new Error('failed to get credit limit str')
  
  const credInfo = creditStr.spilt(' ');
  const creditsUsed = credInfo[0];
  const creditsLimited = credInfo[2];

  const plan = await page.waitForSelector('div["zp-card-title zp_kiN_m"]', {visible: true, timeout: 10000});

  return [creditsUsed, creditsLimited];
}

export const apolloUpgradeAccount = async (): Promise<Upgrade> => {
  const page = scraper.page() as Page
  await scraper.visit('app.apollo.io/#/settings/plans/upgrade');
  const selector = await page!.waitForSelector('div[class="zp_LXyot"]', {visible: true, timeout: 10000});
  if (!selector) throw new Error('failed to upgrade account');

  const upgradeButton = await page.$$('div[class="zp_LXyot"]');
  await upgradeButton[1].click();

  const confirmUpgradeButton = await page.$('button[class="zp-button zp_zUY3r zp_eFcMr zp_OztAP zp_Bn90r"]');
  if (!confirmUpgradeButton) throw new Error('failed to upgrade, cannot find upgrade button')
  await confirmUpgradeButton.click()

  const planSelector = await page.waitForSelector('div[class="zp-card-title zp_kiN_m"]', {visible: true, timeout: 10000});
  if (!planSelector) throw new Error('failed to upgrade, cannot find plan type');

  const planStr = await planSelector.evaluate(() => {
    const e = document.querySelector('div[class="zp-card-title zp_kiN_m"]')
    //@ts-ignore
    return e ? e.innerText : null
  }) as string | null
  if (!planStr) throw new Error('failed to find plan')
  const plan = planStr.split(' ')[0];

  const trialEndSelector = await page.$('div[class="zp_SJzex"]');
  if (!trialEndSelector) throw new Error('failed to upgrade, cannot find trial end date');
  const trialEndDateStr = await trialEndSelector.evaluate(() => {
    const e = document.querySelector('div[class="zp_SJzex"]')
    //@ts-ignore
    return e ? e.innerText : null
  })
  if (!trialEndDateStr) throw new Error('failed to find trial end date')
  const trialEndDate = trialEndDateStr.split(':')[1].trim();

  const creditsSelector = await page.$$('div[class="zp_SJzex"]');
  if (!creditsSelector) throw new Error('failed to upgrade, cannot find credits info');
  const creditsStr = await page.evaluate(() => {
    const e = document.querySelectorAll('div[class="zp_SJzex"]')
    if (!e) return null
    if (e.length > 1) return null
    //@ts-ignore
    return e[1].innerText
  })
  if (!creditsStr) throw new Error('failed to upgrade, cannot find credits info');

  const credInfo = creditsStr.spilt(' ');
  const creditsUsed = credInfo[0];
  const creditsLimited = credInfo[2];

  return {
    plan,
    trialEnd: trialEndDate,
    credits: {
      used: creditsUsed,
      limit: creditsLimited 
    }
  }
}


export const createApolloAccount = async () => {
  await scraper.restartBrowser()

  const apollo = scraper.page() as Page

  const tempMail = await scraper.browser()?.newPage()
  if (!tempMail) throw new Error('failed access email service, please try again')
  
  await tempMail.goto('temp-mail.org')
  await tempMail.bringToFront(); 

  const emailSelector = await tempMail.waitForSelector('input[class="emailbox-input opentip"]', {visible: true, timeout: 10000});
  if (!emailSelector) throw new Error('failed to fine email, please try again')

  const email = await tempMail.evaluate(() => {
    const e = document.querySelector('input[class="emailbox-input opentip"]')
    //@ts-ignore
    return e ? e.innerText : null
  }) as string | null
  if (!email) throw new Error('faied to get email, please try again');

  await apollo?.goto('www.apollo.io/sign-up')
  await apollo.bringToFront();

  const input = await apollo?.waitForSelector('input[class="MuiInputBase-input MuiOutlinedInput-input mui-style-1x5jdmq"]', {visible: true, timeout: 10000})
  if (!input) throw new Error('failed to register for apollo');
  await input.type(email)
  
  const tsCheckbox = await apollo.$('input[class="PrivateSwitchBase-input mui-style-1m9pwf3"]')
  if (!tsCheckbox) throw new Error('failed to find T&S checkbox')
  await tsCheckbox.click()

  const signupButton = await apollo.$('button[class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedBlack MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-disableElevation MuiButton-root MuiButton-contained MuiButton-containedBlack MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-disableElevation mui-style-1t8qqg8"]')
  if (!signupButton) throw new Error('failed to find signup button')
  await signupButton.click()

  // signup error selector p[class="MuiTypography-root MuiTypography-bodySmall mui-style-1gvdvzz"]
}