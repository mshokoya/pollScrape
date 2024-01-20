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
  getBrowserCookies
} from './util';
import {apolloDoc} from './dom/scrapeData';
import { IAccount } from '../database/models/accounts';
import { IRecord } from '../database/models/records';
import { addCookiesToAccount } from '../database';


// https://www.zenrows.com/blog/puppeteer-extra#puppeteer-extra-plugin-recaptcha
// https://gist.github.com/jeroenvisser101/636030fe66ea929b63a33f5cb3a711ad

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
    await page.waitForSelector(apolloLoggedInSearchBarSelector, { visible: true });
  }
}

export const goToApolloSearchUrl = async (apolloSearchURL: string) => {
  const page = await scraper.visit(apolloSearchURL);
  await page.waitForSelector(apolloTableRowSelector, { visible: true });
}

export const apolloStartPageScrape = async (): Promise<IRecord> => {
  const page = scraper.page() as Page
  const data = (await apolloDoc(page) as unknown) as IRecord;
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
  if (!scraper.browser()) {
    await scraper.launchBrowser()
  }

  const loginInputFieldSelector = '[class="zp_bWS5y zp_J0MYa"]' // [email, password]
  const loginButtonSelector = '[class="zp-button zp_zUY3r zp_H_wRH"]'
  const incorrectLoginSelector = '[class="zp_nFR11"]'
  const emptyFieldsSelector = '[class="error-label zp_HeV9x"]'
  const popupSelector = '[class="zp_RB9tu zp_0_HyN"]'
  const popupCloseButtonSelector = '[class="zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_rzbAy"]'

  scraper.visit('https://app.apollo.io/#/login')
  const page = scraper.page()

  if (!page) throw Error('failed to start browser (cookies)')

  await page.waitForSelector(loginInputFieldSelector, {visible: true})

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

// (FIX) FINISH
export const logIntoApollo = async (account: IAccount) => {
  let p: Promise<void>;

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


// export const InjectCookies = async (account: IAccount) => {
//   const page = scraper.page() as Page;

//   await visitGoogle();
//   if (account.cookies) {
//     await setBrowserCookies(page, account.cookies); // needs work (cookest from string to array)
//   }
//   await visitApollo();

//   const pageUrl = page.url();
  
//   // check if logged in via url
//   if (pageUrl.includes(apolloLoggedOutURLSubstr)) {
//     await apolloLogin(account.apollo.email, account.apollo.password)
//   } 
// }

// export const setupApollo = async (account) => {
//   const p = scraper.page();

//   await visitGoogle();
//   if (account.cookies) {
//     await setBrowserCookies(p, account.cookies); // needs work (cookest from string to array)
//   }
//   await visitApollo(s);

//   const pageUrl = p.url();
  
//   // check if logged in via url
//   if (pageUrl.includes(apolloLoggedOutURLSubstr)) {
//     await apolloLogin(s, account.apollo.email, account.apollo.password)
//   } 
// }