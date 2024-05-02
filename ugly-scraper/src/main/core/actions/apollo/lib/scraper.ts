import puppeteer from 'puppeteer-extra'
import { Browser, Page } from 'puppeteer-extra-plugin/dist/puppeteer'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import StealthUserAgent from 'puppeteer-extra-plugin-anonymize-ua'
import AdBlockerPlugin from 'puppeteer-extra-plugin-adblocker'
// import Devtools from 'puppeteer-extra-plugin-devtools'
import { hideDom } from './util'
import { AppError } from '../../../util'
import { io } from '../../../websockets'
import { generate } from 'generate-password'

export type BrowserContext = {
  id: string
  context: any
  page: Page
  type: 'headless' | 'head'
}

// export type BrowserContext = {
//   page: Page
// }

puppeteer.use(StealthPlugin())
puppeteer.use(
  StealthUserAgent({
    stripHeadless: true,
    makeWindows: true
  })
)
puppeteer.use(AdBlockerPlugin({ blockTrackers: true }))
// const dt = Devtools()
// dt.setAuthCredentials('bob', 'swordfish')
// puppeteer.use(dt)

export const scraper = (() => {
  let headlessBrowser: Browser | null = null
  let browser: Browser | null = null
  let headlessContextList: BrowserContext[] = []
  let contextList: BrowserContext[] = []
  // const _Block = new Mutex()

  const newBrowser = async (headless: boolean) => {
    // @ts-ignore
    const l: BrowserContext = {}
    let context: any

    if (headless) {
      if (!headlessBrowser) {
        headlessBrowser = await puppeteer.launch({ headless: true })
      }
      context = await headlessBrowser.createBrowserContext()
      l.type = 'headless'
    } else {
      if (!browser) {
        browser = await puppeteer.launch({ headless: false })
      }
      context = await browser.createBrowserContext()
      l.type = 'head'
    }

    l.id = generate({ length: 15, numbers: true })
    l.context = context
    l.page = await context.newPage()

    headless ? headlessContextList.push(l) : contextList.push(l)

    return l
  }

  const visit = async (page: Page, url: string): Promise<Page> => {
    await page.goto(url)
    return page
  }

  const close = async (context: BrowserContext) => {
    await context.page.close()
    await context.context.close()

    if (context.type === 'headless') {
      if (headlessContextList.length === 1) {
        await headlessBrowser
          ?.close()
          .catch(() => {})
          .finally(() => {
            headlessBrowser = null
            headlessContextList = []
          })
      } else {
        headlessContextList = headlessContextList.filter((c) => c.id !== context.id)
      }
    } else {
      if (contextList.length === 1) {
        await browser
          ?.close()
          .catch(() => {})
          .finally(() => {
            browser = null
            contextList = []
          })
      } else {
        contextList = contextList.filter((c) => c.id !== context.id)
      }
    }
  }

  const closeByID = async (id: string) => {
    const context = contextList.find((ctx) => ctx.id === id)
    if (!context) {
      console.log('failed to find CTX')
      return
    }
    await context.page.close()
    await context.context.close()
    if (contextList.length === 1) {
      await browser
        ?.close()
        .catch(() => {})
        .finally(() => {
          browser = null
          contextList = []
        })
    } else {
      contextList = contextList.filter((c) => c.id !== context.id)
    }
  }

  return {
    newBrowser,
    visit,
    close,
    closeByID
  }
})()

export const visitGoogle = async ({ page }: BrowserContext) => {
  await page.goto('https://www.google.com/')
  await page.waitForSelector('.RNNXgb', { visible: true })
}

export const apolloInitSignup = async (taskID: string, browserCTX: BrowserContext) => {
  await browserCTX.page.goto('https://www.apollo.io/sign-up').then(async () => {
    await hideDom(browserCTX)
  })

  const tsCheckbox = await browserCTX.page.waitForSelector(
    'input[class="PrivateSwitchBase-input mui-style-1m9pwf3"]',
    { visible: true }
  )
  if (!tsCheckbox) throw new AppError(taskID, 'failed to find T&S checkbox')
  await tsCheckbox.click().then(() => {
    io.emit('apollo', { taskID, message: 'click on apollo terms & services checkbox' })
  })
}
