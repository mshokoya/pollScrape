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
  context: any
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
  let headlessContextList: BrowserContext[] = [];
  let contextList: BrowserContext[] = [];
  const _Block = new Mutex();

  const newBrowser = async (headless: boolean) => {
      try{
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

      } catch (err: any) {
        console.log('WWEE ARREE INN BROWSER ERROR')
      }
      
  }

  const visit = async (page: Page, url: string): Promise<Page> => {
    await page.goto(url);
    return page;
  }

  const close = async (context: BrowserContext) => {
      let l: BrowserContext[];


      await context.page.close()
        .then(() => {
          console.log('CLOSE PAGE');
        })

      await context.context.close()
        .then(() => {
            console.log('CLOSE CONTEXT PAGE');
        })

      context.type === 'headless'
        ? l = headlessContextList
        : l = contextList;

      if (l.length === 1) {
        if (context.type === 'headless') {
          l = []
          
          await headlessBrowser?.close()
            .then(() => { 
              console.log('we close headless');
              headlessBrowser = null
            })
        } else {
          l = l.filter(bc => bc.id !== context.id)
          await browser?.close()
            .then(() => {
              console.log('we close head');
              browser = null
            })
        }
      } else {
        console.log('head close')
        //@ts-ignore
        await context.context.close()
          .then(() => {
            console.log('we close')
          })
          .catch(() => {
            console.log('close fail')
          })
      }

      console.log('close lggg')
  
      // to make happen after all async calls are complete (synchronousity) (may not work)
      await l.filter(c => c.id !== context.id) 
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
    .then(() => { io.emit('apollo', {taskID, message: "click on apollo terms & services checkbox"}) });
}