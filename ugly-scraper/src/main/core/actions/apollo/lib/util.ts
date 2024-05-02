import { Page } from 'puppeteer-extra-plugin/dist/puppeteer'
import { BrowserContext, visitGoogle } from './scraper'
import { logIntoApollo } from '.'
import { updateAccount } from '../../../database'
import { IAccount } from '../../../database/models/accounts'
import { io } from '../../../websockets'
import { AppError, delay } from '../../../util'

export type CreditsInfo = {
  emailCreditsUsed: number
  emailCreditsLimit: number
  renewalDateTime?: number
  renewalStartDate: number
  renewalEndDate: number
  trialDaysLeft?: number
}

// ================
//full = https://app.apollo.io/#/onboarding/checklist
export const apolloLoggedInURLSubstr = 'onboarding/checklist'
// ================
//full = https://app.apollo.io/#/login
export const apolloLoggedOutURLSubstr = '#/login'
// ================
//full = // https://app.apollo.io/#/people
export const apolloPeopleURLSubstr = '/people'
export const apolloTableRowSelector = '.zp_RFed0'

export const setBrowserCookies = async ({ page }: BrowserContext, cookies: string) => {
  const items = JSON.parse(cookies)
    .map((cookie: Record<string, string>) => {
      const item = Object.assign({}, cookie)
      if (!item.value) item.value = ''
      console.assert(!item.url, `Cookies must have a URL defined`)
      console.assert(item.url !== 'about:blank', `Blank page can not have cookie "${item.name}"`)
      console.assert(
        !String.prototype.startsWith.call(item.url || '', 'data:'),
        `Data URL page can not have cookie "${item.name}"`
      )
      return item
    })
    .filter((cookie: Record<string, string>) => cookie.name)

  await page.deleteCookie(...items)

  if (items.length) {
    const client = await page.target().createCDPSession()
    await client.send('Network.setCookies', { cookies: items })
  }
}

export const getBrowserCookies = async ({ page }: BrowserContext): Promise<string[]> => {
  const cookies = await page.cookies()
  return cookies as unknown as string[]
}

// export const getBrowserCookies = async (): Promise<string[]> => {
//   const client = await scraper.page()!.target().createCDPSession();
//   const { cookies } = await client.send('Network.getAllCookies');

//   return (cookies as unknown) as string[];
// };

export const waitForNavigationTo = (
  taskID: string,
  browserCTX: BrowserContext,
  location: string,
  dest?: string
) =>
  new Promise<boolean>((resolve, _reject) => {
    const browser_check = setInterval(async () => {
      if (!browserCTX.page.url() || browserCTX.page.url().includes(location)) {
        clearInterval(browser_check)
        if (!browserCTX.page.url()) {
          _reject(new AppError(taskID, 'failled interval'))
        } else {
          resolve(true)
        }

        // @ts-ignore
      }
      // else if ((await browserCTX.context.pages()).length === 0) {
      //   clearInterval(browser_check)
      //   throw new AppError(
      //     taskID,
      //     `browser closed before reaching ${dest ? dest : 'destined route'}`
      //   )
      // }
    }, 3000)
  })

export const injectCookies = async (browserCTX: BrowserContext, cookies?: string) => {
  await visitGoogle(browserCTX)
  if (cookies) {
    await setBrowserCookies(browserCTX, cookies) // needs work (cookest from string to array)
  }
}

export const hideDom = async ({ page }: BrowserContext) => {
  await page.evaluate(() => {
    const ol = document.createElement('div')
    ol.className = 'zombie-s'
    ol.style.cssText +=
      'position:fixed;top:0;left:0;right:0;bottom:0;z-index:1000;background-color:black;pointer-events:none;display:flex;justify-content:center;align-items:center; font-size: 70%; color: white'
    ol.innerText = 'Please do not do anything until this message is gone'
    const dom = document.querySelector('html')
    if (!dom) return
    dom.insertBefore(ol, dom.firstChild)
  })
}

export const visibleDom = async ({ page }: BrowserContext) => {
  await page.evaluate(() => {
    const element = document.querySelector('[class="zombie-s"]')
    if (!element) return
    element.remove()
  })
}

export const waitForNavHideDom = async ({ page }: BrowserContext) => {
  await page.waitForNavigation({ waitUntil: 'domcontentloaded' }).then(async () => {
    await page.evaluate(() => {
      const ol = document.createElement('div')
      ol.className = 'zombie-s'
      ol.style.cssText +=
        'position:fixed;top:0;left:0;right:0;bottom:0;z-index:1000;background-color:black;pointer-events:none;display:flex;justify-content:center;align-items:center; font-size: 70%; color: white'
      ol.innerText = 'Please do not do anything until this message is gone'
      const dom = document.querySelector('html')
      if (!dom) return
      dom.insertBefore(ol, dom.firstChild)
    })
  })
}

export const logIntoApolloThenVisit = async (
  taskID: string,
  browserCTX: BrowserContext,
  account: IAccount,
  url: string
) => {
  const page = browserCTX.page as Page
  page.goto(url)

  await page.waitForNavigation({ timeout: 15000 }).then(async () => {
    await delay(7000)

    // if (page.mainFrame().url().includes('/#/login')) {
    if (!browserCTX.page.url() || page.url().includes('/#/login')) {
      if (!browserCTX.page.url()) throw new AppError(taskID, 'Failed to find url')
      await logIntoApollo(taskID, browserCTX, account).then(() => {
        io.emit('apollo', { taskID, message: 'Logged into apollo' })
      })
      const cookies = await getBrowserCookies(browserCTX)
      await updateAccount({ id: account.id }, { cookies: JSON.stringify(cookies) })
      await browserCTX.page.goto(url)
    }
  })
}
