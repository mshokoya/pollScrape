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

export const createApolloAccount = async () => {
  await scraper.restartBrowser()

  const apollo = scraper.page() as Page

  const tempMail = await scraper.browser()?.newPage()
  if (!tempMail) throw new Error('failed access email service, please try again')
  
  await tempMail.goto('temp-mail.org')
  await tempMail.bringToFront(); 

  const emailSelector = await tempMail.waitForSelector('input[class="emailbox-input opentip"]', {visible: true, timeout: 10000}).catch(() => null);
  if (!emailSelector) throw new Error('failed to fine email, please try again')

  const email = await tempMail.evaluate(() => {
    const e = document.querySelector('input[class="emailbox-input opentip"]')
    //@ts-ignore
    return e ? e.innerText : null
  }) as string | null
  if (!email) throw new Error('faied to get email, please try again');

  await apollo?.goto('www.apollo.io/sign-up')
  await apollo.bringToFront();

  const input = await apollo?.waitForSelector('input[class="MuiInputBase-input MuiOutlinedInput-input mui-style-1x5jdmq"]', {visible: true, timeout: 10000}).catch(() => null)
  if (!input) throw new Error('failed to register for apollo');
  await input.type(email)
  
  const tsCheckbox = await apollo.$('input[class="PrivateSwitchBase-input mui-style-1m9pwf3"]')
  if (!tsCheckbox) throw new Error('failed to find T&S checkbox')
  await tsCheckbox.click()

  const signupButton = await apollo.$('button[class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedBlack MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-disableElevation MuiButton-root MuiButton-contained MuiButton-containedBlack MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-disableElevation mui-style-1t8qqg8"]')
  if (!signupButton) throw new Error('failed to find signup button')
  await signupButton.click()

  // re-route to https://www.apollo.io/sign-up/success
  // input disappears (wait till it does not exist)   // MuiInputBase-input MuiOutlinedInput-input mui-style-1x5jdmq

  // signup error selector p[class="MuiTypography-root MuiTypography-bodySmall mui-style-1gvdvzz"]
}

export const apolloConfirmAccount = async (confirmationURL: string) => {
  await scraper.visit(confirmationURL)

  // once clicked it leads you here 
  // https://app.apollo.io/#/claim?token=1yLHdLGSyP1GJPbwcOrV1A&set_name=true

  // full name field
  // input[class="zp_bWS5y zp_J0MYa"][name="name"][id="claim-name"]

  // password field
  // input[class="zp_bWS5y zp_J0MYa"][name="password"][id="new-password"]

  // retype password field (disabled)
  // input[class="zp_bWS5y zp_J0MYa zp_bWH9b"][name="confirmPassword"][id="o27d34b45-fe18-42d5-a678-e9ab525a2357-input"][type="password"] 

  // retype password field (enabled)
  // input[class="zp_bWS5y zp_J0MYa"][name="confirmPassword"][id="o27d34b45-fe18-42d5-a678-e9ab525a2357-input"][type="password"] 

  // invalid field
    // div[class="zp_pbSCI"]
    // e.g error // Password must be at least 10 characters.
    // e.g Email and/or password don't match with any of our records.

  // ===============================================================
        // redirect page

  // ================================================================
  // routed to    https://app.apollo.io/#/join-team    (if multiple accounts with domain)

  // start new team
  // button[class="zp-button zp_zUY3r zp_MCSwB zp_OztAP zp_LUHm0"][type="button"]

  // join team
  // button[class="zp-button zp_zUY3r zp_OztAP zp_wlMPY"][type="button"]

 // ================================================================
        // https://app.apollo.io/#/onboarding-hub/welcome/video

    // click to continue
    // button[class="zp_kxUTD"]
  // ================================================================
      // https://app.apollo.io/#/onboarding-hub/welcome/landing

      // click to skip
  // button[class="zp-button zp_zUY3r zp_MCSwB"]

  // ================================================================
            // https://app.apollo.io/#/onboarding-hub/queue
      
      // CONFIRMATION COMPLETE

  // ================================================================
          // put in search param to click button and remove popups

          // clicked table element
          // div[class="zp_bns67 zp_veHM9"] > button[type="button"][class="zp-button zp_zUY3r"]    //look for 2, one always exists on dom
                  // OR
          // button[class="zp-button zp_zUY3r"][1]

                  // THEN wait for 
          // button[class="zp-button zp_zUY3r zp_MCSwB zp_iNK2i"][type="button"]

                  // THEN click
          // i[class="zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_rzbAy"]


  // ================================================================ 
  return {}
}