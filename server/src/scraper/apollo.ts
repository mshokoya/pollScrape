import { logIntoApollo } from ".";
import { updateAccount } from "../database";
import { IAccount } from "../database/models/accounts";
import { IRecord } from "../database/models/records";
import { apolloDoc } from "./dom/scrapeData";
import { BrowserContext } from "./scraper";
import { apolloLoggedOutURLSubstr, apolloTableRowSelector, delay, getBrowserCookies, injectCookies, waitForNavHideDom } from "./util";
import { Page } from 'puppeteer-extra-plugin/dist/puppeteer';

type Upgrade = {
  plan: string
  trialEnd: string
  credits: {
    used: string
    limit: string
  }
}

type CreditsInfo = {
  emailCreditsUsed: number
  emailCreditsLimit: number
  renewalDateTime?: number
  renewalStartDate: number
  renewalEndDate: number
  trialDaysLeft?: number
};

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

export const visitApollo = async (browserCTX: BrowserContext) => {
  const page = browserCTX.page
  await page.goto("https://app.apollo.io");
  await page.waitForSelector(".zp_bWS5y, .zp_J0MYa", { visible: true });
}

export const visitApolloLoginPage = async (browserCTX: BrowserContext, hideApolloDom: boolean = false) => {
  await browserCTX.page.goto('https://app.apollo.io/#/login')
    .then(async (page) => { 
      if (hideApolloDom) await waitForNavHideDom(browserCTX) 
      return page
    })
  // await page.waitForSelector('input[class="zp_bWS5y zp_J0MYa"][name="email"]', { visible: true, timeout: 10000 });
}

export const goToApolloSearchUrl = async ({page}: BrowserContext, apolloSearchURL: string) => {
  await page.goto(apolloSearchURL);
  await page.waitForSelector(apolloTableRowSelector, { visible: true });
}

export const apolloStartPageScrape = async ({page}: BrowserContext) => {
  const data = (await apolloDoc(page) as unknown) as IRecord[];
  return data;
}



export const apolloDefaultLogin = async (browserCTX: BrowserContext, account: Partial<IAccount>) => {
  const loginInputFieldSelector = '[class="zp_bWS5y zp_J0MYa"]' // [email, password]
  const loginButtonSelector = '[class="zp-button zp_zUY3r zp_H_wRH"]'
  const incorrectLoginSelector = '[class="zp_nFR11"]'
  const emptyFieldsSelector = '[class="error-label zp_HeV9x"]'
  const popupSelector = '[class="zp_RB9tu zp_0_HyN"]'
  const popupCloseButtonSelector = '[class="zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_rzbAy"]'  // once click on 'access email'

  if (!account.email || !account.password) throw new Error('failed to login, credentials missing');

  const page = browserCTX.page
  
  if (!page.url().includes(apolloLoggedOutURLSubstr)) {
    await visitApolloLoginPage(browserCTX)
  }

  const submitButton = await page.waitForSelector(loginButtonSelector, {visible: true, timeout: 10000}).catch(() => null);
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

export const setupApolloForScraping = async (browserCTX: BrowserContext, account: IAccount) => {
  await injectCookies(browserCTX, account.cookie)
  await visitApollo(browserCTX);

  const page = browserCTX.page as Page;
  const pageUrl = page.url();
  
  // check if logged in via url
  if (pageUrl.includes(apolloLoggedOutURLSubstr)) {
    logIntoApollo(browserCTX, account)
    const cookies = await getBrowserCookies(browserCTX)
    const updatedAccount = await updateAccount({_id: account._id}, {cookie: JSON.stringify(cookies)})
    if (!updatedAccount) throw new Error('Failed to save cookies')
  } 
}

// (FIX) test to make sure it works (test all possibilities)
export const apolloGetCreditsInfo = async ({page}: BrowserContext): Promise<CreditsInfo> => {

  const creditSelector = await page.waitForSelector('div[class="zp_ajv0U"]', {visible: true, timeout: 10000}).catch(() => null)
  if (!creditSelector) throw new Error('failed to get credit limit')

  const creditStr = await page.evaluate(() => {
    const emailCreditInfo: any = document.querySelectorAll('div[class="zp_ajv0U"]')
    if (!emailCreditInfo && emailCreditInfo.length < 2) return null

    const renewalDate = document.querySelector('[class="zp_SJzex"]')
    if (!renewalDate) return null
    if (!renewalDate.lastChild) return null

    const renewalStartEnd = document.querySelector('[class="zp_kQfcf"]')
    if (!renewalStartEnd) return null

    const trialDaysLeft = document.querySelector('[class="zp_EanJu"]')
    
    return {
      // @ts-ignore
      emailCreditInfo: emailCreditInfo[1].innerText as string,
      // @ts-ignore
      renewalDate: renewalDate.lastChild.innerText as string,
      // @ts-ignore
      renewalStartEnd: renewalStartEnd.innerText as string,
      // @ts-ignore
      trialDaysLeft: trialDaysLeft ? trialDaysLeft.innerText : null
    }
  })

  if (!creditStr) throw new Error('failed to get credit limit str')
  
  // output = '0 of 100 emails / mo'
  const credInfo = creditStr.emailCreditInfo.split(' ');
  const emailCreditsUsed = parseInt(credInfo[0]);
  const emailCreditsLimit = parseInt(credInfo[2].replace(',',''));
  
  // output = 'Credits will renew: Feb 27, 2024 8:00 AM'
  const renewalDateTime =  creditStr.renewalDate
    ? Date.parse(creditStr.renewalDate.split(':')[1].trim())
    : undefined


  // output = 'Jan 27, 2024 - Feb 27, 2024'
  const renewalStartEnd = creditStr.renewalStartEnd.split('-')
  
  const renewalStartDate = Date.parse(renewalStartEnd[0].trim())
  const renewalEndDate = Date.parse(renewalStartEnd[1].trim())

  const trialDaysLeft = parseInt(creditStr.trialDaysLeft) || undefined;

  return {
    emailCreditsUsed,
    emailCreditsLimit,
    renewalDateTime,
    renewalStartDate,
    renewalEndDate,
    trialDaysLeft
  };
}

// (FIX) need to check if account is already upgraded first
export const upgradeApolloAccount = async ({page}: BrowserContext): Promise<void> => {

  const selector = await page.waitForSelector('[class="zp_s6UAl"]', {visible: true, timeout: 10000}).catch(() => null);
  if (!selector) throw new Error('failed to upgrade account');

  const upgradeButton = await page.$$('div[class="zp_LXyot"]');
  if (!upgradeButton.length) throw new Error("Failed to upgrade account. You've already upgraded your account before")
  await upgradeButton[1].click();

  const confirmUpgradeButton = await page.$('button[class="zp-button zp_zUY3r zp_eFcMr zp_OztAP zp_Bn90r"]');
  if (!confirmUpgradeButton) throw new Error('failed to upgrade, cannot find upgrade button')
  await confirmUpgradeButton.click();

  await page.waitForNavigation({timeout:10000})

  // const planSelector = await page.waitForSelector('div[class="zp-card-title zp_kiN_m"]', {visible: true, timeout: 10000}).catch(() => null);
  // if (!planSelector) throw new Error('failed to upgrade, cannot find plan type');
}

export const apolloDefaultSignup = async ({page}: BrowserContext, account: Partial<IAccount>) => {
  if (!account.domainEmail) throw new Error('failed to login, credentials missing');

  await page.goto('https://www.apollo.io/sign-up')

  const input = await page.waitForSelector('input[class="MuiInputBase-input MuiOutlinedInput-input mui-style-1x5jdmq"]', {visible: true, timeout: 10000}).catch(() => null)
  if (!input) throw new Error('failed to register for apollo');
  await input.type(account.domainEmail)
  
  const tsCheckbox = await page.$('input[class="PrivateSwitchBase-input mui-style-1m9pwf3"]')
  if (!tsCheckbox) throw new Error('failed to find T&S checkbox')
  await tsCheckbox.click()

  const signupButton = await page.$('[class="MuiBox-root mui-style-1tu59u4"]').catch(() => null)
  if (!signupButton) throw new Error('failed to find signup button')
  await signupButton.click()

  delay(2000)

  const inputError = await page.$('p[class="MuiTypography-root MuiTypography-bodySmall mui-style-1ccelp7"]').catch(() => null)
  if (inputError) throw new Error('Failed to signup, error in email')

  await page.waitForNavigation({timeout: 5000})

  // re-route to https://www.apollo.io/sign-up/success
  // input disappears (wait till it does not exist)   // MuiInputBase-input MuiOutlinedInput-input mui-style-1x5jdmq

  // signup error selector p[class="MuiTypography-root MuiTypography-bodySmall mui-style-1gvdvzz"]
}

export const apolloConfirmAccount = async (browserCTX: BrowserContext, confirmationURL: string, account: IAccount) => {
  const page = browserCTX.page

  await page.goto(confirmationURL)

  const nameField = await page.waitForSelector('input[class="zp_bWS5y zp_J0MYa"][name="name"]', {visible: true, timeout: 10000}).catch(() => null)
  if (!nameField) throw new Error('Failed to find full name field')
  await nameField.type(account.password)
    .catch(() => {})

  const passwordField = await page.$('input[class="zp_bWS5y zp_J0MYa"][name="password"]')
  if (!passwordField) throw new Error('Failed to find password field')
  await passwordField.type(account.apolloPassword)
    .catch(() => {})

  const confirmPasswordField = await page.$('input[class="zp_bWS5y zp_J0MYa"][name="confirmPassword"]')
  if (!confirmPasswordField) throw new Error('Failed to find confirm password field')
  await confirmPasswordField.type(account.apolloPassword)
    .catch(() => {})

    delay(10000)

  const submitButton = await page.$('button[class="zp-button zp_zUY3r zp_aVzf8"]')
  if (!submitButton) throw new Error('Failed to find confirm password field')
  await submitButton.click()

  
  let counter = 0
  while (counter <= 5) {

    const onboardingButton = await page.$('[class="zp-button zp_zUY3r zp_OztAP zp_lshSd"]').catch(() => null) //on lead search page (this selected is used by el by default)
    const apolloSkipButton = await page.$('[class="zp-button zp_zUY3r zp_MCSwB"]').catch(() => null)
    const newTeamButton = await page.$('button[class="zp-button zp_zUY3r zp_MCSwB zp_OztAP zp_LUHm0"][type="button"]').catch(() => null)
    const close = await page.$('[class="zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_rzbAy"]').catch(() => null)
    const url = page.url();

    if (newTeamButton) {
      await newTeamButton.click({delay: 1000})
      counter = 0

    } else if (onboardingButton) {
      await onboardingButton.click({delay:1000})
      counter = 0

    } else if (apolloSkipButton) {
      await apolloSkipButton.click({delay:1000})
      counter = 0

    } else if (close) {
      await close.click({delay:1000})
      counter = 0

    } else if (url.includes('signup-success')) {
      await page.goto('https://app.apollo.io/')
      counter = 0
      
    } else if (
      url.includes('app.apollo.io/#/onboarding-hub/queue') ||
      url.includes('app.apollo.io/#/control-center') ||
      url.includes('app.apollo.io/#/sequences') ||
      url.includes('app.apollo.io/#/conversations') ||
      url.includes('app.apollo.io/#/opportunities') ||
      url.includes('app.apollo.io/#/enrichment-status') ||
      url.includes('app.apollo.io/#/settings')
    ) {
      break

    } else if (url.includes('message=not_registered')) {
      throw new Error('failed to signup')
    } else {
      counter++
    }

    await delay(5000)
  }
}