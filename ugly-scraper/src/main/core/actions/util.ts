import { Page } from 'puppeteer-extra-plugin/dist/puppeteer'

export const waitForElement = async ({
  page,
  intervalTime = 3000,
  countLimit = 5
}: {
  page: Page
  intervalTime?: number
  countLimit?: number
}) => {
  function waitForElement(selector) {
    const limit = countLimit
    let count = 0
    const intervalId = setInterval(() => {
      console.log('INTERVALL')
      if (document.querySelector(selector) || count >= limit) {
        clearInterval(intervalId)
      }
      count++
    }, intervalTime)
  }

  await page.exposeFunction('waitForElement', waitForElement)
}

export const waitForElementHide = async ({
  page,
  intervalTime = 3000,
  countLimit = 5
}: {
  page: Page
  intervalTime?: number
  countLimit?: number
}) => {
  function waitForElementHide(selector) {
    const limit = countLimit
    let count = 0
    const intervalId = setInterval(() => {
      console.log('INTERVALL HIDE')
      if (!document.querySelector(selector) || count >= limit) {
        clearInterval(intervalId)
      }
      count++
    }, intervalTime)
  }

  await page.exposeFunction('waitForElementHide', waitForElementHide)
}

export const eval_delay = async ({ page }: { page: Page }) => {
  const delay = (time: number) => {
    return new Promise(function (resolve) {
      setTimeout(resolve, time)
    })
  }

  await page.exposeFunction('delay', delay)
}
