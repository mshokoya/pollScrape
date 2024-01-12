import puppeteer from 'puppeteer-extra';
import { Browser, Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import StealthUserAgent from 'puppeteer-extra-plugin-anonymize-ua';
import AdBlockerPlugin from 'puppeteer-extra-plugin-adblocker';
import {
  apolloTableRowSelector,
  setBrowserCookies,
  visitGoogle,
  apolloLoggedOutURLSubstr
} from './util';
import {apolloDoc} from './dom/scrapeData';
import { IAccount } from '../database/models/accounts';
import { IRecord } from '../database/models/records';


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
  let browser: Browser | null;
  let page: Page | null;
  
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

export const apolloLogin = async (email: string, password: string) => {
  const page = scraper.page() as Page

  // apollo login page
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

  const emailInput = page.$(apolloEmailFieldSelector);
  const passInput = page.$(apolloPasswordFieldSelector);
  const submitButton = page.$(apolloSubmitButtonSelector);
  
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

    return true;
  }

  return false;
}

export const goToApolloSearchUrl = async (apolloSearchURL: string) => {
  const page = await scraper.visit(apolloSearchURL);
  await page.waitForSelector(apolloTableRowSelector, { visible: true });
}

export const apolloScrapePage = async (): Promise<IRecord> => {
  const page = scraper.page() as Page
  const data = (await apolloDoc(page) as unknown) as IRecord;
  return data;
}

export const injectCookies = async (cookies?: string) => {
  const page = scraper.page() as Page;

  await visitGoogle();
  if (cookies) {
    await setBrowserCookies(page, cookies); // needs work (cookest from string to array)
  }
}

export const setupApolloForScraping = async (account: IAccount) => {
  await injectCookies(account.cookies)
  await visitApollo();

  const page = scraper.page() as Page;
  const pageUrl = page.url();
  
  // check if logged in via url
  if (pageUrl.includes(apolloLoggedOutURLSubstr)) {
    await apolloLogin(account.email, account.password)
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