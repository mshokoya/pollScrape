import puppeteer from 'puppeteer-extra';
import { Browser, Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import StealthUserAgent from 'puppeteer-extra-plugin-anonymize-ua';
import AdBlockerPlugin from 'puppeteer-extra-plugin-adblocker';
// import devtools from 'puppeteer-extra-plugin-devtools';
import { hideDom } from './util';


puppeteer.use(StealthPlugin());
puppeteer.use(StealthUserAgent({
  stripHeadless: true,
  makeWindows: true
}));
puppeteer.use(AdBlockerPlugin({ blockTrackers: true }))

export const scraper = (() => {
  let u: number = 0;
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  return {
    launchBrowser: async () => {
      if (!browser) {
        browser = await puppeteer.launch({headless:false})
        page = await browser.newPage()
      }
      u++
    },
    restartBrowser: async (): Promise<void> => {
      if (browser !== null) await browser.close();
      browser = await puppeteer.launch();
      page = await browser.newPage();
    },
    visit: async (url: string): Promise<Page> => {
      await page!.goto(url);
      return page!;
    },
    close: async () => {
      if (u === 1) {
        await browser?.close();
        browser = null;
        page = null;
      } 
      if (u > 0) u--; // make sure never in minus
    },
    page: () => page,
    browser: () => browser,
  }
})()

export const visitGoogle = async () => {
  const page = await scraper.visit("https://www.google.com/");
  await page.waitForSelector(".RNNXgb", { visible: true });
}

export const apolloInitSignup = async () => {
  const page = scraper.page() as Page
  await scraper.visit('https://www.apollo.io/sign-up')
    .then(async () => { await hideDom(page) })
  
  const tsCheckbox = await page.waitForSelector('input[class="PrivateSwitchBase-input mui-style-1m9pwf3"]', {visible: true})
  if (!tsCheckbox) throw new Error('failed to find T&S checkbox')
  await tsCheckbox.click()
}