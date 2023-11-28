import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import StealthUserAgent from 'puppeteer-extra-plugin-anonymize-ua';
import AdBlockerPlugin from 'puppeteer-extra-plugin-adblocker';

// https://www.zenrows.com/blog/puppeteer-extra#puppeteer-extra-plugin-recaptcha
// https://gist.github.com/jeroenvisser101/636030fe66ea929b63a33f5cb3a711ad

puppeteer.use(StealthPlugin());
puppeteer.use(StealthUserAgent({
  stripHeadless: true,
  makeWindows: true
}));
puppeteer.use(AdBlockerPlugin({ blockTrackers: true }))

// login - https://app.apollo.io/#/login

export const scraper = () => {
  let browser;
  let page;
  
  return {
    launchBrowser: async () => {
      browser = await puppeteer.launch({headless: false})
      await browser.newPage()
    },
    visit: async (url) => {
      const v = await browser.goto(url);
      page = v
    },
    close: async () => {
      await browser.close();
    },
    page: () => page,
    browser: () => browser,
  }
}


// ======================================

