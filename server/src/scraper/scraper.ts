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
      browser = await puppeteer.launch()
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

export const visitGoogle = async () => {
  const page = await scraper.visit("https://www.google.com/");
  await page.waitForSelector(".RNNXgb", { visible: true });
}




