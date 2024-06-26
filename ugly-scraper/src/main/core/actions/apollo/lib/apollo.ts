import { logIntoApollo } from '.'
import { IAccount, IRecord } from '../../../../../shared'
import { updateAccount } from '../../../database'
import { AppError, delay } from '../../../util'
import { io } from '../../../websockets'
import { apolloDoc } from './dom/scrapeData'
import { BrowserContext } from './scraper'
import {
  CreditsInfo,
  apolloLoggedOutURLSubstr,
  apolloTableRowSelector,
  getBrowserCookies,
  injectCookies,
  waitForNavHideDom
} from './util'
import { Page } from 'puppeteer-extra-plugin/dist/puppeteer'

export const visitApollo = async (taskID: string, browserCTX: BrowserContext) => {
  const page = browserCTX.page
  await page.goto('https://app.apollo.io')
  await page.waitForSelector('.zp_bWS5y, .zp_J0MYa', { visible: true })
}

export const visitApolloLoginPage = async (
  taskID: string,
  browserCTX: BrowserContext,
  hideApolloDom: boolean = false
) => {
  await browserCTX.page.goto('https://app.apollo.io/#/login').then(async (page) => {
    if (hideApolloDom) await waitForNavHideDom(browserCTX)
    return page
  })
  // await page.waitForSelector('input[class="zp_bWS5y zp_J0MYa"][name="email"]', { visible: true, timeout: 10000 });
}

export const goToApolloSearchUrl = async (
  taskID: string,
  { page }: BrowserContext,
  apolloSearchURL: string
) => {
  await page.goto(apolloSearchURL)
  // (FIX) table mey be visible but contents are not loaded... leading to error
  await page.waitForSelector(apolloTableRowSelector, { visible: true })
}

export const apolloStartPageScrape = async (taskID: string, { page }: BrowserContext) => {
  const data = (await apolloDoc(page)) as unknown as IRecord[]
  return data
}

export const visitApolloDefaultLogin = async (
  taskID: string,
  browserCTX: BrowserContext,
  account: Partial<IAccount>
) => {
  const page = browserCTX.page
  const loginInputFieldSelector = '[class="zp_bWS5y zp_J0MYa"]' // [email, password]
  const loginButtonSelector = '[class="zp-button zp_zUY3r zp_H_wRH"]'

  if (!account.email || !account.password)
    throw new AppError(taskID, 'failed to login, credentials missing')

  await visitApolloLoginPage(taskID, browserCTX)

  const submitButton = await page
    .waitForSelector(loginButtonSelector, { visible: true, timeout: 10000 })
    .catch(() => null)
  const login = await page?.$$(loginInputFieldSelector)

  if (!login.length || !submitButton) throw new AppError(taskID, 'failed to login')

  await login[0].type(account.email)
  await login[1].type(account.password)
}

export const apolloDefaultLogin = async (
  taskID: string,
  browserCTX: BrowserContext,
  account: Partial<IAccount>
) => {
  const loginInputFieldSelector = '[class="zp_bWS5y zp_J0MYa"]' // [email, password]
  const loginButtonSelector = '[class="zp-button zp_zUY3r zp_H_wRH"]'
  const incorrectLoginSelector = '[class="zp_nFR11"]'
  const emptyFieldsSelector = '[class="error-label zp_HeV9x"]'
  const popupSelector = '[class="zp_RB9tu zp_0_HyN"]'
  const popupCloseButtonSelector =
    '[class="zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_rzbAy"]' // once click on 'access email'

  if (!account.email || !account.password)
    throw new AppError(taskID, 'failed to login, credentials missing')

  const page = browserCTX.page

  if (!page.url().includes(apolloLoggedOutURLSubstr)) {
    await visitApolloLoginPage(taskID, browserCTX).then(() => {})
  }

  const submitButton = await page
    .waitForSelector(loginButtonSelector, { visible: true, timeout: 10000 })
    .catch(() => null)
  const login = await page?.$$(loginInputFieldSelector)

  if (!login.length || !submitButton) throw new AppError(taskID, 'failed to login')

  await login[0].type(account.email)
  await login[1].type(account.password)

  await submitButton?.click()
  // route hit on login - https://app.apollo.io/#/onboarding-hub/queue

  await delay(2000)

  const incorrectLogin = await page.$(incorrectLoginSelector)
  const emptyFields = await page.$(emptyFieldsSelector)

  if (incorrectLogin) {
    throw Error(
      'failed to login, incorrect login details, please make sure login details are correct by manually logging in'
    )
  } else if (emptyFields) {
    throw Error(
      'failed to login, email or password field empty, please update account details with corrent details'
    )
  }

  await delay(2000)

  if (
    !page.url() ||
    page.url().includes('#/login') ||
    page.url().includes('google.com') ||
    page.url().includes('microsoftonline.com')
  ) {
    throw new AppError(
      taskID,
      'failed to login, could not navigate to dashboard, please login manually and make sure login details are correct and working'
    )
  }
}

export const setupApolloForScraping = async (
  taskID: string,
  browserCTX: BrowserContext,
  account: IAccount
) => {
  await injectCookies(browserCTX, account.cookies)
  await visitApollo(taskID, browserCTX)

  const page = browserCTX.page as Page
  const pageUrl = page.url()
  if (!pageUrl) throw new AppError(taskID, 'Failed to find url')

  // check if logged in via url
  if (pageUrl.includes(apolloLoggedOutURLSubstr)) {
    await logIntoApollo(taskID, browserCTX, account)
    const cookies = await getBrowserCookies(browserCTX)
    const updatedAccount = await updateAccount(
      { id: account.id },
      { cookies: JSON.stringify(cookies) }
    )
    if (!updatedAccount) throw new AppError(taskID, 'Failed to save cookies')
  }
}

// (FIX) test to make sure it works (test all possibilities)
export const apolloGetCreditsInfo = async (
  taskID: string,
  { page }: BrowserContext
): Promise<CreditsInfo> => {
  const creditSelector = await page
    .waitForSelector('div[class="zp_ajv0U"]', { visible: true, timeout: 10000 })
    .catch(() => null)
  if (!creditSelector) throw new AppError(taskID, 'failed to get credit limit')

  const creditStr = await page.evaluate(() => {
    const emailCreditInfo: any = document.querySelectorAll('div[class="zp_ajv0U"]')
    if (!emailCreditInfo && emailCreditInfo.length < 2) return null

    const renewalDate = document.querySelector('[class="zp_SJzex"]')
    if (!renewalDate) return null
    if (!renewalDate.lastChild) return null

    const renewalStartEnd = document.querySelector('[class="zp_kQfcf"]')
    if (!renewalStartEnd) return null

    const trialDaysLeft = document.querySelector('[class="zp_EanJu"]')

    return {
      // @ts-ignore
      emailCreditInfo: emailCreditInfo[1].innerText as string,
      // @ts-ignore
      renewalDate: renewalDate.lastChild.innerText as string,
      // @ts-ignore
      renewalStartEnd: renewalStartEnd.innerText as string,
      // @ts-ignore
      trialDaysLeft: trialDaysLeft ? trialDaysLeft.innerText : null
    }
  })

  if (!creditStr) throw new AppError(taskID, 'failed to get credit limit str')

  // output = '0 of 100 emails / mo'
  const credInfo = creditStr.emailCreditInfo.split(' ')
  const emailCreditsUsed = parseInt(credInfo[0])
  const emailCreditsLimit = parseInt(credInfo[2].replace(',', ''))

  // output = 'Credits will renew: Feb 27, 2024 8:00 AM'
  const renewalDateTime = creditStr.renewalDate
    ? Date.parse(creditStr.renewalDate.split(':')[1].trim())
    : undefined

  // output = 'Jan 27, 2024 - Feb 27, 2024'
  const renewalStartEnd = creditStr.renewalStartEnd.split('-')

  const renewalStartDate = Date.parse(renewalStartEnd[0].trim())
  const renewalEndDate = Date.parse(renewalStartEnd[1].trim())

  const trialDaysLeft = parseInt(creditStr.trialDaysLeft) || undefined

  return {
    emailCreditsUsed,
    emailCreditsLimit,
    renewalDateTime,
    renewalStartDate,
    renewalEndDate,
    trialDaysLeft
  }
}

// (FIX) need to check if account is already upgraded first
export const upgradeApolloAccount = async (
  taskID: string,
  { page }: BrowserContext
): Promise<void> => {
  const selector = await page
    .waitForSelector('[class="zp_s6UAl"]', { visible: true, timeout: 10000 })
    .catch(() => null)
  if (!selector) throw new AppError(taskID, 'failed to upgrade account')

  const upgradeButton = await page.$$('div[class="zp_LXyot"]')
  if (!upgradeButton.length)
    throw new AppError(
      taskID,
      "Failed to upgrade account. You've already upgraded your account before"
    )
  await upgradeButton[1].click().then(() => {
    io.emit('apollo', { taskID, message: 'click the upgrade button' })
  })

  const confirmUpgradeButton = await page.$(
    'button[class="zp-button zp_zUY3r zp_eFcMr zp_OztAP zp_Bn90r"]'
  )
  if (!confirmUpgradeButton)
    throw new AppError(taskID, 'failed to upgrade, cannot find upgrade button')
  await confirmUpgradeButton.click().then(() => {
    io.emit('apollo', { taskID, message: "click the 'confirm' button" })
  })

  await page.waitForNavigation({ timeout: 10000 })

  // const planSelector = await page.waitForSelector('div[class="zp-card-title zp_kiN_m"]', {visible: true, timeout: 10000}).catch(() => null);
  // if (!planSelector) throw new AppError(taskID,'failed to upgrade, cannot find plan type');
}

export const apolloDefaultSignup = async (
  taskID: string,
  { page }: BrowserContext,
  account: Partial<IAccount>
) => {
  if (!account.email) throw new AppError(taskID, 'failed to login, credentials missing')

  await page.goto('https://www.apollo.io/sign-up').then(() => {
    io.emit('apollo', { taskID, message: 'navigated to the apollo signup page' })
  })

  const input = await page
    .waitForSelector('input[class="MuiInputBase-input MuiOutlinedInput-input mui-style-1x5jdmq"]', {
      visible: true,
      timeout: 10000
    })
    .catch(() => null)
  if (!input) throw new AppError(taskID, 'failed to register for apollo')
  await input.type(account.email).then(() => {
    io.emit('apollo', { taskID, message: 'entered email into field' })
  })

  const tsCheckbox = await page.$('input[class="PrivateSwitchBase-input mui-style-1m9pwf3"]')
  if (!tsCheckbox) throw new AppError(taskID, 'failed to find T&S checkbox')
  await tsCheckbox.click().then(() => {
    io.emit('apollo', { taskID, message: 'checked the terms & service checkbox' })
  })

  const signupButton = await page.$('[class="MuiBox-root mui-style-1tu59u4"]').catch(() => null)
  if (!signupButton) throw new AppError(taskID, 'failed to find signup button')
  await signupButton.click().then(() => {
    io.emit('apollo', { taskID, message: 'click the signup button' })
  })

  await delay(2000)

  const inputError = await page
    .$('p[class="MuiTypography-root MuiTypography-bodySmall mui-style-1ccelp7"]')
    .catch(() => null)
  if (inputError) throw new AppError(taskID, 'Failed to signup, error in email')

  await page.waitForNavigation({ timeout: 5000 })

  // re-route to https://www.apollo.io/sign-up/success
  // input disappears (wait till it does not exist)   // MuiInputBase-input MuiOutlinedInput-input mui-style-1x5jdmq

  // signup error selector p[class="MuiTypography-root MuiTypography-bodySmall mui-style-1gvdvzz"]
}

export const apolloConfirmAccount = async (
  taskID: string,
  browserCTX: BrowserContext,
  confirmationURL: string,
  account: IAccount
) => {
  const page = browserCTX.page

  await page.goto(confirmationURL).then(() => {
    io.emit('apollo', { taskID, message: 'navigated to confimation page' })
  })

  const nameField = await page
    .waitForSelector('input[class="zp_bWS5y zp_J0MYa"][name="name"]', {
      visible: true,
      timeout: 10000
    })
    .catch(() => null)
  if (!nameField) throw new AppError(taskID, 'Failed to find full name field')
  await nameField
    .type(account.password)
    .then(() => {
      io.emit('apollo', { taskID, message: "entered name into 'name' field" })
    })
    .catch(() => {})

  const passwordField = await page.$('input[class="zp_bWS5y zp_J0MYa"][name="password"]')
  if (!passwordField) throw new AppError(taskID, 'Failed to find password field')
  await passwordField
    .type(account.password)
    .then(() => {
      io.emit('apollo', { taskID, message: "entered password into 'password' field" })
    })
    .catch(() => {})

  const confirmPasswordField = await page.$(
    'input[class="zp_bWS5y zp_J0MYa"][name="confirmPassword"]'
  )
  if (!confirmPasswordField) throw new AppError(taskID, 'Failed to find confirm password field')
  await confirmPasswordField
    .type(account.password)
    .then(() => {
      io.emit('apollo', { taskID, message: "entered password in 'confirm password' field" })
    })
    .catch(() => {})

  await delay(10000)

  const submitButton = await page.$('button[class="zp-button zp_zUY3r zp_aVzf8"]')
  if (!submitButton) throw new AppError(taskID, 'Failed to find confirm password field')
  await submitButton.click().then(() => {
    io.emit('apollo', { taskID, message: "clicked the 'submit' button" })
  })

  let counter = 0
  while (counter <= 5) {
    const onboardingButton = await page
      .$('[class="zp-button zp_zUY3r zp_OztAP zp_lshSd"]')
      .catch(() => null) //on lead search page (this selected is used by el by default)
    const apolloSkipButton = await page.$('[class="zp-button zp_zUY3r zp_MCSwB"]').catch(() => null)
    const newTeamButton = await page
      .$('button[class="zp-button zp_zUY3r zp_MCSwB zp_OztAP zp_LUHm0"][type="button"]')
      .catch(() => null)
    const close = await page
      .$('[class="zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_rzbAy"]')
      .catch(() => null)
    const url = page.url()

    if (newTeamButton) {
      await newTeamButton.click({ delay: 1000 }).then(() => {
        io.emit('apollo', { taskID, message: 'selected new team for account in apollo' })
      })

      counter = 0
    } else if (onboardingButton) {
      await onboardingButton.click({ delay: 1000 }).then(() => {
        io.emit('apollo', { taskID, message: "clicked 'skip' button on apollo onboarding page" })
      })
      counter = 0
    } else if (apolloSkipButton) {
      await apolloSkipButton.click({ delay: 1000 }).then(() => {
        io.emit('apollo', { taskID, message: "clicked 'skip' button on popup in apollo" })
      })
      counter = 0
    } else if (close) {
      await close.click({ delay: 1000 }).then(() => {
        io.emit('apollo', { taskID, message: 'clicked on popup close button in apollo' })
      })
      counter = 0
    } else if (url.includes('signup-success')) {
      await page.goto('https://app.apollo.io/').then(() => {
        io.emit('apollo', { taskID, message: 'navigated to apollo dashboard' })
      })
      counter = 0
    } else if (
      url.includes('app.apollo.io/#/onboarding-hub/queue') ||
      url.includes('app.apollo.io/#/control-center') ||
      url.includes('app.apollo.io/#/sequences') ||
      url.includes('app.apollo.io/#/conversations') ||
      url.includes('app.apollo.io/#/opportunities') ||
      url.includes('app.apollo.io/#/enrichment-status') ||
      url.includes('app.apollo.io/#/settings')
    ) {
      break
    } else if (url.includes('message=not_registered')) {
      throw new AppError(taskID, 'failed to signup')
    } else {
      counter++
    }

    await delay(5000)
  }
}

// (FIX) use page.evaluate
export const apolloAddLeadsToListAndScrape = async (
  taskID: string,
  browserCTX: BrowserContext,
  limit: number,
  listName: string,
  lastName: { get: () => string; set: (n: any) => void }
) => {
  const page = browserCTX.page

  const tableRowsSelector = '[class="zp_RFed0"]'
  const checkboxSelector = '[class="zp_fwjCX"]'
  const addToListInputSelector = '[class="Select-input "]'
  const saveListButtonSelector = '[class="zp-button zp_zUY3r"][type="submit"]'
  const SLPopupSelector = '[class="zp_lMRYw zp_yHIi8"]'
  const savedListTableRowSelector = '[class="zp_cWbgJ"]'
  const paginationInfoSelector = '[class="zp_VVYZh"]'
  const getFirstTableRowName = async () => {
    const row = await page.$(tableRowsSelector)
    return await row.$eval('.zp_BC5Bd', (el) => el.innerText)
  }

  await page.waitForSelector(paginationInfoSelector, { visible: true, timeout: 10000 })

  let shouldContinue = true
  let c = 0
  while (shouldContinue && c < 3) {
    if ((await getFirstTableRowName()) !== lastName.get()) shouldContinue = false
    await delay(5000)
    c += 1
  }

  lastName.set(await getFirstTableRowName())

  const rows = await page.$$(tableRowsSelector)
  for (let i = 0; i < limit; i++) {
    const check = await rows[i].$(checkboxSelector)
    if (!check) continue
    await check.click()
  }

  const l = await page.$$(
    '[class="zp-button zp_zUY3r zp_hLUWg zp_n9QPr zp_B5hnZ zp_MCSwB zp_ML2Jn"]'
  )

  if (!l.length) throw new AppError(taskID, 'failed to find list button')
  await l[1].click()

  const b = await page.waitForSelector('[class="zp-menu-item zp_fZtsJ zp_pEvFx"]', {
    visible: true,
    timeout: 5000
  })
  if (!b) throw new AppError(taskID, 'failed to find doo to list button')
  await b.click()

  await delay(3000)

  const addToListInput = await page.$$(addToListInputSelector)
  if (!addToListInput[1]) throw new Error('add to list fail')
  await page.keyboard.type(listName)
  await addToListInput[1].focus()

  const saveListButton = await page.$(saveListButtonSelector)
  if (!saveListButton) throw new Error('save list button fail')
  await saveListButton.click()

  await page.waitForSelector(SLPopupSelector, { hidden: true }) // or {visible: false}

  await delay(2000)

  await page.goto('https://app.apollo.io/#/people/tags?teamListsOnly[]=no')
  await page.waitForSelector(savedListTableRowSelector, { visible: true, timeout: 10000 })

  let counter = 0
  let ln = await page.$eval(
    savedListTableRowSelector,
    // @ts-ignore
    (el) => el.querySelector('[class="zp_aBhrx"]')?.innerText
  )
  while (ln !== listName && counter <= 5) {
    await page.reload()
    await page.waitForSelector(savedListTableRowSelector, { visible: true, timeout: 10000 })
    ln = await page.$eval(
      savedListTableRowSelector,
      // @ts-ignore
      (el) => el.querySelector('[class="zp_aBhrx"]')?.innerText
    )
    counter++
    await delay(3000)
  }

  const savedListTableRow = await page.$(savedListTableRowSelector)
  if (!savedListTableRow) return

  await savedListTableRow.click()

  await page.waitForSelector(tableRowsSelector, { visible: true, timeout: 10000 })

  return (await apolloDoc(page)) as IRecord[]
}

// (FIX) test to see if it works
export const getSavedListAndScrape = async (
  taskID: string,
  browserCTX: BrowserContext,
  listName: string
) => {
  const page = browserCTX.page
  const tableRowsSelector = '[class="zp_RFed0"]'
  const savedListTableSelector = '[class="zp_G5KZB"]'
  const savedListTableRowsSelector = '[class="zp_cWbgJ"]'

  await page.goto('https://app.apollo.io/#/people/tags?teamListsOnly[]=no')
  await page.waitForSelector(savedListTableSelector, { visible: true, timeout: 10000 })

  let listIdx: number | null = null
  const rows = await page.$$(savedListTableRowsSelector)

  let counter = 0
  while (counter <= 4) {
    const activeNextButton = await page
      .$('[class="zp-button zp_zUY3r zp_MCSwB zp_xCVC8"]')
      .catch(() => null)
    const disabledNextButton = await page
      .$('[class="zp-button zp_zUY3r zp_BAp0M zp_MCSwB zp_xCVC8"]')
      .catch(() => null)

    const idx = await page.evaluate((listName) => {
      let idx = null
      const listOfRows = document.querySelectorAll('[class="zp_cWbgJ"]')
      for (let i = 0; i < listOfRows.length; i++) {
        // @ts-ignore
        const rowTitle = listOfRows[i].querySelector('[class="zp_aBhrx"]').innerText
        if (rowTitle === listName) {
          idx = i
          break
        }
      }
      return idx
    }, listName)

    if (idx !== null) {
      listIdx = idx
      break
    } else if (activeNextButton) {
      await activeNextButton.click()
      counter = 0
    } else if (disabledNextButton) {
      break
    }

    await delay(3000)
  }

  if (listIdx === null) {
    throw new AppError(taskID, 'failed to find list')
  }

  await rows[listIdx].click()
  await page.waitForSelector(tableRowsSelector, { visible: true, timeout: 10000 })

  return (await apolloDoc(page)) as IRecord[]
}

// error oversave

// -- error dialog --
// div[role="dialog"][class="apolloio-css-vars-reset zp zp-modal zp_iDDtd"]
// div[role="dialog"][class="apolloio-css-vars-reset zp zp-modal zp_iDDtd zp_APRN8 api-error-modal"]

// -- error container --
// div[class="apolloio-css-vars-reset zp_xfGlC"]

// --text--
// div[class="zp_Om6BZ"] > span
// -
// Prospecting is blocked for 24 hours because you have violated our Terms of Services for the Unlimited plan. (Code 7)
// In order to protect the platform and our customers' data, Apollo has automated security measures in place to prevent behaviors that are against our Terms of Service and may hurt our infrastructure. The block will be lifted automatically at the end of the specified term.
// Our system identified a prospecting rate that is unusual for a human, and a limit was placed on your team to protect our database from any automations. Please check our Terms of Service to avoid behaviors that could block your account temporarily or permanently.

// -- X/Close button ---
// [class="zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_rzbAy"]

// -- OK/Close button --
// div[role="dialog"][class="apolloio-css-vars-reset zp zp-modal zp_iDDtd zp_APRN8 api-error-modal"] > [class="zp-button zp_zUY3r"]
