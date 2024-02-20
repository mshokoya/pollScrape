import puppeteer from 'puppeteer-extra';
import { Browser, Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import StealthUserAgent from 'puppeteer-extra-plugin-anonymize-ua';
import AdBlockerPlugin from 'puppeteer-extra-plugin-adblocker';
import { hideDom } from './util';
import { generate } from 'generate-password';
import { Mutex } from 'async-mutex';
import { AppError } from '../helpers';
import { io } from '../websockets';

export type BrowserContext = {
  id: string
  context: unknown
  page: Page
  type: 'headless' | 'head'
}

puppeteer.use(StealthPlugin());
puppeteer.use(StealthUserAgent({
  stripHeadless: true,
  makeWindows: true
}));

puppeteer.use(AdBlockerPlugin({ blockTrackers: true }));

export const scraper = (() => {
  let headlessBrowser: Browser | null = null;
  let browser: Browser | null = null;
  const headlessContextList: BrowserContext[] = [];
  const contextList: BrowserContext[] = [];
  const _Block = new Mutex();

  const newBrowser = async (headless: boolean) => {
    return _Block.runExclusive(async () => {
      // @ts-ignore
      const l: BrowserContext = {};
      let context: any;
      let page: Page;

      if (headless) {
        if (!headlessBrowser) { headlessBrowser = await puppeteer.launch({headless:true}) }
        context = await headlessBrowser.createIncognitoBrowserContext()
        l.type = 'headless'
      } else {
        if (!browser) { browser = await puppeteer.launch({headless:false}) }
        context = await browser.createIncognitoBrowserContext()
        l.type = 'head'
      }

      page = await context.newPage()

      l.id = generate({length: 15, numbers: true})
      l.context = context
      l.page = page

      headless
        ? headlessContextList.push(l)
        : contextList.push(l)

      return l
    })
  }

  const visit = async (page: Page, url: string): Promise<Page> => {
    await page.goto(url);
    return page;
  }

  const close = async (context: BrowserContext) => {
    return _Block.runExclusive(async () => {
      let l: BrowserContext[];

      context.type === 'headless'
        ? l = headlessContextList
        : l = contextList;

      if (l.length === 1) {
        context.type === 'headless'
          ? await headlessBrowser?.close()
          : await browser?.close()
      } else {
        //@ts-ignore
        await context.context.close()
      }
  
      // to make happen after all async calls are complete (synchronousity) (may not work)
      await l.filter(c => c.id !== context.id) 
    })
  }

  return {
    newBrowser,
    visit,
    close
  }
})()

export const visitGoogle = async ({page}: BrowserContext) => {
  await page.goto("https://www.google.com/");
  await page.waitForSelector(".RNNXgb", { visible: true })
}

export const apolloInitSignup = async (taskID: string, browserCTX: BrowserContext) => {
  await browserCTX.page.goto('https://www.apollo.io/sign-up')
    .then(async () => { await hideDom(browserCTX) })
  
  const tsCheckbox = await browserCTX.page.waitForSelector('input[class="PrivateSwitchBase-input mui-style-1m9pwf3"]', {visible: true})
  if (!tsCheckbox) throw new AppError(taskID,'failed to find T&S checkbox')
  await tsCheckbox.click()
    .then(() => { io.emit('apollo', {taskID, message: "click on apollo terms & services checkbox", ok: true}) });
}