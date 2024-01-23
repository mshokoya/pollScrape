import puppeteer from 'puppeteer-extra';
import { Browser, Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import StealthUserAgent from 'puppeteer-extra-plugin-anonymize-ua';
import AdBlockerPlugin from 'puppeteer-extra-plugin-adblocker';
import {
  apolloTableRowSelector,
  setBrowserCookies,
  apolloLoggedOutURLSubstr,
  delay,
  getBrowserCookies,
} from './util';
import {apolloDoc} from './dom/scrapeData';
import { IAccount } from '../database/models/accounts';
import { IRecord } from '../database/models/records';
import { addCookiesToAccount } from '../database';


// https://www.zenrows.com/blog/puppeteer-extra#puppeteer-extra-plugin-recaptcha
// https://gist.github.com/jeroenvisser101/636030fe66ea929b63a33f5cb3a711ad

type Upgrade = {
  plan: string
  trialEnd: string
  credits: {
    used: string
    limit: string
  }
}

puppeteer.use(StealthPlugin());
puppeteer.use(StealthUserAgent({
  stripHeadless: true,
  makeWindows: true
}));
puppeteer.use(AdBlockerPlugin({ blockTrackers: true }))

// login - https://app.apollo.io/#/login

export const scraper = (() => {
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  return {
    launchBrowser: async () => {
      browser = await puppeteer.launch({headless: false})
      page = await browser.newPage()
    },
    restartBrowser: async (): Promise<void> => {
      if (browser !== null) await browser.close();
      browser = await puppeteer.launch({headless: false});
      page = await browser.newPage();
    },
    visit: async (url: string): Promise<Page> => {
      await page!.goto(url);
      return page!;
    },
    close: async () => {
      await browser!.close();
      browser = null;
      page = null;
    },
    page: () => page,
    browser: () => browser,
  }
})()

export const visitApollo = async () => {
  const page = await scraper.visit("https://app.apollo.io");
  await page.waitForSelector(".zp_bWS5y, .zp_J0MYa", { visible: true });
}

export const visitApolloLoginPage = async () => {
  const page = await scraper.visit('https://app.apollo.io/#/login')
  await page.waitForSelector('input[class="zp_bWS5y zp_J0MYa"][name="email"]', { visible: true });
}

// (FIX) complete func
export const apolloGoogleLogin = async (email: string, password: string) => {
  const page = scraper.page() as Page

  // apollo login page
  const apolloEmailFieldSelector = 'input[class="zp_bWS5y zp_J0MYa"][name="email"]';
  const apolloPasswordFieldSelector = 'input[class="zp_bWS5y zp_J0MYa"][name="password"]';
  const apolloSubmitButtonSelector = 'button[class="zp-button zp_zUY3r zp_H_wRH"][type="submit"]';

  // gmail button
  const apolloGmailButtonSelector = 'input[class="zp-button zp_zUY3r zp_n9QPr zp_MCSwB zp_eFcMr zp_grScD"]';

  // email
  const gmailEmailFieldSelector = 'input[class="whsOnd zHQkBf"][type="email"]';
  const gmailInvalidEmailSelector = 'input[class="whsOnd zHQkBf"][type="email"][aria-invalid="true"]';

  // password
  const gmailPasswordFieldSelector = 'input[class="whsOnd zHQkBf"][type="password"]';
  const gmailInvalidPasswordSelector = 'input[class="whsOnd zHQkBf"][type="password"][aria-invalid="true"]';

  // email next button
  const gmailNextButtonSelector = 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 qIypjc TrZEUc lw1w4b"]';

  const emailInput = await page.$(apolloEmailFieldSelector);
  const passInput = await page.$(apolloPasswordFieldSelector);
  const submitButton = await page.$(apolloSubmitButtonSelector);

  if (!!emailInput && !!passInput && !!submitButton) {
    await page.click(apolloGmailButtonSelector);

    await page.waitForSelector(gmailEmailFieldSelector, { visible: true });
    await page.type(gmailEmailFieldSelector, email);
    await page.click(gmailNextButtonSelector);

    await page.waitForSelector(gmailPasswordFieldSelector, {visible: true, timeout: 5000});

    const isEmailInvalid = await page.$(gmailInvalidEmailSelector)
    if (isEmailInvalid) {
      throw new Error('invalid email (google)')
    }

    await page.type(gmailPasswordFieldSelector, password);
    await page.click(gmailNextButtonSelector);

    // await page.waitForSelector()
    // heres where multiple thing can happen e.g different type of verification or login 

  }
}

export const apolloOutlookLogin = async (email: string, password: string) => {
  const page = scraper.page() as Page

  if (!page.url().includes(apolloLoggedOutURLSubstr)) {
    await visitApolloLoginPage()
  }

  // apollo login page (use to make sure navigated to login page)
  const apolloEmailFieldSelector = 'input[class="zp_bWS5y zp_J0MYa"][name="email"]';
  const apolloPasswordFieldSelector = 'input[class="zp_bWS5y zp_J0MYa"][name="password"]';
  const apolloSubmitButtonSelector = 'button[class="zp-button zp_zUY3r zp_H_wRH"][type="submit"]';

  // outlook login page 
  const outlookButtonSelector = '[class="zp-button zp_zUY3r zp_n9QPr zp_MCSwB zp_eFcMr zp_grScD zp_bW01P"]';
  const emailInputFieldSelector = '[class="form-control ltr_override input ext-input text-box ext-text-box"]';
  const nextButton1 = '[class="win-button button_primary button ext-button primary ext-primary"]';
  const passwordFieldSelector = '[class="form-control input ext-input text-box ext-text-box"]';
  const nextButton2 = nextButton1;
  
  const staySignedInButtonSelector = '.win-button, .button_primary, .button, .ext-button, .primary, .ext-primary';
  
  const apolloLoggedInSearchBarSelector = '.zp_bWS5y, .zp_J0MYa, .zp_EIhoD, zp_EYQkR';

  const emailInput = await page.$(apolloEmailFieldSelector);
  const passInput = await page.$(apolloPasswordFieldSelector);
  const submitButton = await page.$(apolloSubmitButtonSelector);
  
  if (!!emailInput && !!passInput && !!submitButton) {
    await page.click(outlookButtonSelector);

    // email input page
    await page.waitForSelector(emailInputFieldSelector, { visible: true });
    await page.type(emailInputFieldSelector, email);
    await page.waitForTimeout(1000)
    await page.click(nextButton1);

    // password input page
    await page.waitForSelector(passwordFieldSelector, { visible: true });
    await page.type(passwordFieldSelector, password);
    await page.waitForTimeout(1000)
    await page.click(nextButton2);

    // Stay signed in page
    await page.waitForTimeout(3000)
    await page.waitForSelector(staySignedInButtonSelector);
    await page.click(staySignedInButtonSelector);

    // apollo searchbar (logged in) (success)
    await page.waitForSelector(apolloLoggedInSearchBarSelector, { visible: true, timeout: 10000 })
  }
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

export const visitGoogle = async () => {
  const page = await scraper.visit("https://www.google.com/");
  await page.waitForSelector(".RNNXgb", { visible: true });
}

export const injectCookies = async (cookies?: string) => {
  const page = scraper.page() as Page;

  await visitGoogle();
  if (cookies) {
    await setBrowserCookies(page, cookies); // needs work (cookest from string to array)
  }
}

export const apolloDefaultLogin = async (email: string, password: string) => {
  const loginInputFieldSelector = '[class="zp_bWS5y zp_J0MYa"]' // [email, password]
  const loginButtonSelector = '[class="zp-button zp_zUY3r zp_H_wRH"]'
  const incorrectLoginSelector = '[class="zp_nFR11"]'
  const emptyFieldsSelector = '[class="error-label zp_HeV9x"]'
  const popupSelector = '[class="zp_RB9tu zp_0_HyN"]'
  const popupCloseButtonSelector = '[class="zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_rzbAy"]'
  const page = scraper.page() as Page
  
  if (!page.url().includes(apolloLoggedOutURLSubstr)) {
    await visitApolloLoginPage()
  }

  const submitButton = await page?.waitForSelector(loginButtonSelector, {visible: true})
  const login = await page?.$$(loginInputFieldSelector)

  if (!login || !submitButton) throw new Error('failed to login');

  await login[0].type(email)
  await login[1].type(password)

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

// (FIX) FINISH
export const logIntoApollo = async (account: Partial<IAccount>) => {
  
  if (!account.email || !account.password || !account.loginType) {
    throw new Error('login details not provided')
  }

  switch (account.loginType) {
    case 'default':
      await apolloDefaultLogin(account.email, account.password)
      break;
    case 'outlook':
      await apolloOutlookLogin(account.email, account.password)
      break;
    case 'google':
      console.log('NEED TO IMPLIMENT')
      throw new Error('NEED TO IMPLIMENT')
    default:
      await apolloDefaultLogin(account.email, account.password)
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
  const selector = await page!.waitForSelector('div[class="zp_ajv0U"]', {visible: true, timeout: 10000})
  if (!selector) throw new Error('failed to get credit limit')
  // 
  const l = selector.innerText as string[]
  console.log(l)
  // 
  const credInfo = l.spilt(' ');
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

const verifyGmail = async (recoverEmail: string) => {
  

  const page = scraper.page() as Page;

  const verifyStr = await page.evaluate(() => {
    const e = document.querySelector('span[jsslot]')
    // @ts-ignore
    return e ? e.innerText : null
  })
  if (!verifyStr) throw new Error('failed to confirm if verification is required')

  if (verifyStr !== 'Verify that it’s you') throw new Error('verification not required')

  const verificationMethods = await page.$$('div[class="vxx8jf"]')
  let confirmRecovEmailIdx = -1;

  if (!verificationMethods) throw new Error('failed to get verification methods')

  if (verificationMethods.length !== 4) {
    for (let i = 0; i < verificationMethods.length; i++) {
      const isCRE = await page.evaluate((idx) => {
        const c = document.querySelectorAll('div[class="vxx8jf')[idx]
        // @ts-ignore
        return c ? c.innerText : null
      }, i) as string | null

      if (isCRE && isCRE.includes('Confirm your recovery email')) {
        confirmRecovEmailIdx = i
        break
      }
    }
  } else {
    confirmRecovEmailIdx = 2;
  }

  if (confirmRecovEmailIdx === -1) throw new Error('failed to find "confirm email" recovery method')

  await verificationMethods[confirmRecovEmailIdx].click()

  const recovEmailInputEl = await page.waitForSelector('input[class="whsOnd zHQkBf"]', {visible: true, timeout: 10000});
  if (!recovEmailInputEl) throw new Error('failed to find recovery email input')

  await recovEmailInputEl.type(recoverEmail)

  const newButton = await page.$('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 qIypjc TrZEUc lw1w4b"]')
  if (!newButton) throw new Error('failed to find next button')

  await newButton.click()
}