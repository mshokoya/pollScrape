import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import StealthUserAgent from 'puppeteer-extra-plugin-anonymize-ua';
import AdBlockerPlugin from 'puppeteer-extra-plugin-adblocker';
import {
  apolloTableRowSelector,
  setBrowserCookies,
  visitGoogle,
  apolloLoggedOutURLSubstr
} from './util';
import {apolloDoc} from './apollo';

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
  let browser;
  let page;
  
  return {
    launchBrowser: async () => {
      browser = await puppeteer.launch({headless: false})
      page = await browser.newPage()
    },
    restartBrowser: async () => {
      if (browser !== undefined) await browser.close();
      browser = await puppeteer.launch({headless: false});
      page = await browser.newPage();
    },
    visit: async (url) => {
      await page.goto(url);
      return page;
    },
    close: async () => {
      await browser.close();
      browser = undefined;
      page = undefined;
    },
    page: () => page,
    browser: () => browser,
  }
})()

export const visitApollo = async (scraper) => {
  const page = await scraper.visit("https://app.apollo.io")
  await page.waitForSelector(".zp_bWS5y, .zp_J0MYa", { visible: true });
  
}

export const apolloLogin = async (scraper, email, password) => {
  const page = scraper.page()


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
 
  
  if (emailInput && passInput && submitButton) {
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


export const goToApolloSearchUrl = async (scraper, apolloSearchURL) => {
  const page = await scraper.visit(apolloSearchURL);
  await page.waitForSelector(apolloTableRowSelector, { visible: true });
}


export const apolloScrapePage = async (scraper) => {
  const page = scraper.page()

  const data = await apolloDoc(page);

  console.log('apolloScrapePage');
  console.log(data);

  
  return data;
}

export const setupApollo = async (account) => {
  const s = scraper;
  const p = s.page();

  await visitGoogle(s);
  if (account.cookies) {
    await setBrowserCookies(p, account.cookies); // needs work (cookest from string to array)
  }
  await visitApollo(s);

  const pageUrl = p.url();
  
  // check if logged in via url
  if (pageUrl.includes(apolloLoggedOutURLSubstr)) {
    await apolloLogin(s, account.apollo.email, account.apollo.password)
  } 
}