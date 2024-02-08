import { logIntoApollo } from ".";
import { updateAccount } from "../database";
import { IAccount } from "../database/models/accounts";
import { IRecord } from "../database/models/records";
import { apolloDoc } from "./dom/scrapeData";
import { scraper } from "./scraper";
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
  renewalDateTime: number
  renewalStartDate: number
  renewalEndDate: number
  trialDaysLeft: number
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

export const visitApollo = async () => {
  const page = await scraper.visit("https://app.apollo.io");
  await page.waitForSelector(".zp_bWS5y, .zp_J0MYa", { visible: true });
}

export const visitApolloLoginPage = async (hideApolloDom: boolean = false) => {
  const page = await scraper.visit('https://app.apollo.io/#/login')
    .then(async (page) => { 
      if (hideApolloDom) await waitForNavHideDom() 
      return page
    })
  // await page.waitForSelector('input[class="zp_bWS5y zp_J0MYa"][name="email"]', { visible: true, timeout: 10000 });
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
  const popupCloseButtonSelector = '[class="zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_rzbAy"]'  // once click on 'access email'
  const page = scraper.page() as Page

  if (!account.email || !account.password) throw new Error('failed to login, credentials missing');
  
  if (!page.url().includes(apolloLoggedOutURLSubstr)) {
    await visitApolloLoginPage()
  }

  const submitButton = await page?.waitForSelector(loginButtonSelector, {visible: true, timeout: 10000}).catch(() => null);
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
    const updatedAccount = await updateAccount({_id: account._id}, {cookie: JSON.stringify(cookies)})
    if (!updatedAccount) throw new Error('Failed to save cookies')
  } 
}

// (FIX) test to make sure it works (test all possibilities)
export const apolloGetCreditsInfo = async (): Promise<CreditsInfo> => {
  const page = scraper.page() as Page

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
  const emailCreditsLimit = parseInt(credInfo[2]);

  // output = 'Credits will renew: Feb 27, 2024 8:00 AM'
  const renewalDateTime = Date.parse(creditStr.renewalDate.split(':')[1].trim())

  // output = 'Jan 27, 2024 - Feb 27, 2024'
  const renewalStartEnd = creditStr.renewalStartEnd.split('-')
  const renewalStartDate = Date.parse(renewalStartEnd[0].trim())
  const renewalEndDate = Date.parse(renewalStartEnd[1].trim())

  const trialDaysLeft = parseInt(creditStr.trialDaysLeft) || -1;

  return {
    emailCreditsUsed,
    emailCreditsLimit,
    renewalDateTime,
    renewalStartDate,
    renewalEndDate,
    trialDaysLeft
  };
}

// (FIX) ???
export const upgradeApolloAccount = async (): Promise<void> => {
  const page = scraper.page() as Page

  const selector = await page.waitForSelector('div[class="zp_LXyot"]', {visible: true, timeout: 10000}).catch(() => null);
  if (!selector) throw new Error('failed to upgrade account');

  const upgradeButton = await page.$$('div[class="zp_LXyot"]');
  await upgradeButton[1].click();

  const confirmUpgradeButton = await page.$('button[class="zp-button zp_zUY3r zp_eFcMr zp_OztAP zp_Bn90r"]');
  if (!confirmUpgradeButton) throw new Error('failed to upgrade, cannot find upgrade button')
  await confirmUpgradeButton.click()

  // const planSelector = await page.waitForSelector('div[class="zp-card-title zp_kiN_m"]', {visible: true, timeout: 10000}).catch(() => null);
  // if (!planSelector) throw new Error('failed to upgrade, cannot find plan type');

  // const planStr = await planSelector.evaluate(() => {
  //   const e = document.querySelector('div[class="zp-card-title zp_kiN_m"]')
  //   //@ts-ignore
  //   return e ? e.innerText : null
  // }) as string | null
  // if (!planStr) throw new Error('failed to find plan')
  // const plan = planStr.split(' ')[0];

  // const trialEndSelector = await page.$('div[class="zp_SJzex"]');
  // if (!trialEndSelector) throw new Error('failed to upgrade, cannot find trial end date');
  // const trialEndDateStr = await trialEndSelector.evaluate(() => {
  //   const e = document.querySelector('div[class="zp_SJzex"]')
  //   //@ts-ignore
  //   return e ? e.innerText : null
  // })
  // if (!trialEndDateStr) throw new Error('failed to find trial end date')
  // const trialEndDate = trialEndDateStr.split(':')[1].trim();

  // const creditsSelector = await page.$$('div[class="zp_SJzex"]');
  // if (!creditsSelector) throw new Error('failed to upgrade, cannot find credits info');
  // const creditsStr = await page.evaluate(() => {
  //   const e = document.querySelectorAll('div[class="zp_SJzex"]')
  //   if (!e) return null
  //   if (e.length > 1) return null
  //   //@ts-ignore
  //   return e[1].innerText
  // })
  // if (!creditsStr) throw new Error('failed to upgrade, cannot find credits info');

  // const credInfo = creditsStr.spilt(' ');
  // const creditsUsed = credInfo[0];
  // const creditsLimited = credInfo[2];

  // return {
  //   plan,
  //   trialEnd: trialEndDate,
  //   credits: {
  //     used: creditsUsed,
  //     limit: creditsLimited 
  //   }
  // }
}

export const apolloDefaultSignup = async (account: Partial<IAccount>) => {
  if (!account.domainEmail) throw new Error('failed to login, credentials missing');

  const page = scraper.page() as Page

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

export const apolloConfirmAccount = async (confirmationURL: string, account: IAccount) => {
  const page = scraper.page() as Page

  await scraper.visit(confirmationURL)

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
      await scraper.visit('https://app.apollo.io/')
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