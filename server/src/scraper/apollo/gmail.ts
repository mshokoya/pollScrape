import { Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import { BrowserContext, apolloInitSignup } from './scraper';
import { IAccount } from '../../database/models/accounts';
import { visitApolloLoginPage } from './apollo';
import { delay, waitForNavHideDom } from './util';
import { io } from '../../websockets';
import { AppError } from '../../helpers';

const verifyGmail = async (taskID: string, browserCTX: BrowserContext, recoverEmail: string) => {
  const page = browserCTX.page;

  const verificationMethods = await page.waitForSelector('div[class="vxx8jf"]', {visible: true, timeout: 5000})
    .then(async () => {
      io.emit('apollo', {taskID, message: "finding all verification methods"});
      return await page.$$('div[class="vxx8jf"]')
    })
    .catch(() => null)

  let confirmRecovEmailIdx = -1;
  // VfPpkd-RLmnJb
  // VfPpkd-Jh9lGc
  if (!verificationMethods || !verificationMethods.length) throw new AppError(taskID, 'failed to get verification methods')

  if (verificationMethods.length !== 4) {
    for (let i = 0; i < verificationMethods.length; i++) {
      const isCRE = await page.evaluate((idx) => {
        const c = document.querySelectorAll('div[class="vxx8jf')[idx]
        // @ts-ignore
        return c ? c.innerText : null
      }, i) as string | null

      if (isCRE && isCRE.includes('Confirm your recovery email')) {
        confirmRecovEmailIdx = i
        break
      }
    }
  } else {
    confirmRecovEmailIdx = 2;
  }

  if (confirmRecovEmailIdx === -1) throw new AppError(taskID, 'failed to find "confirm email" recovery method')

  await verificationMethods[confirmRecovEmailIdx].click()
    .then(() => { io.emit('apollo', {taskID, message: "selected the 'recovery email' verification method"}) });

  const recovEmailInputEl = await page.waitForSelector('input[class="whsOnd zHQkBf"]', {visible: true, timeout: 5000}).catch(() => null);
  if (!recovEmailInputEl) throw new AppError(taskID, 'failed to find recovery email input')

  await recovEmailInputEl.type(recoverEmail)
    .then(() => { io.emit('apollo', {taskID, message: "entered recovery email into field"}) });

  const newButton = await page.$('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 qIypjc TrZEUc lw1w4b"]')
  if (!newButton) throw new AppError(taskID, 'failed to find next button')

  await newButton.click()
    .then(() => { io.emit('apollo', {taskID, message: "click then next button"}) });
}

export const visitGmailLoginAuthPortal = async (taskID: string, browserCTX: BrowserContext, hideApolloDom: boolean = false, hidePortalDom: boolean = false) => {
  const page = browserCTX.page

  await visitApolloLoginPage(taskID, browserCTX, hideApolloDom)
    .then(() => { io.emit('apollo', {taskID, message: "navigated to apollo login page"}) });

  const gmailLoginButton = await page.$('button[class="zp-button zp_zUY3r zp_n9QPr zp_MCSwB zp_eFcMr zp_grScD"]')
  if (!gmailLoginButton) throw new AppError(taskID, 'failed to login, could not find google login button')
  await gmailLoginButton.click({delay: 1000})
    .then(async () => { 
      io.emit('apollo', {taskID, message: "clicked the gmail login button"})
      if (hidePortalDom) await waitForNavHideDom(browserCTX) 
    })
}

const gmailAuth = async (taskID: string, browserCTX: BrowserContext, account: Partial<IAccount>) => {
  if (!account.email || !account.password) throw new AppError(taskID, 'failed to login, credentials missing');

  const page = browserCTX.page;

  const emailField = await page.waitForSelector('input[class="whsOnd zHQkBf"][type="email"]', { visible: true, timeout: 10000 });
  if (!emailField) throw new AppError(taskID, 'failed to login, could not input email');
  await emailField.type(account.email)
    .then(() => { io.emit('apollo', {taskID, message: "typed email into field"}) });

  const nextButton1 = await page.$('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 qIypjc TrZEUc lw1w4b"]');
  if (!nextButton1) throw new AppError(taskID, 'failed to login, could not find next button to progress to password page');
  await nextButton1.click({delay: 1000})
    .then(() => { io.emit('apollo', {taskID, message: "clicked the next button"}) });

  let counter = 0
  while (counter <= 5) {
    const heading = await page.evaluate(() => {
      const e = document.querySelector('span[jsslot]')
      // @ts-ignore
      return e ? e.innerText : null
    })
    const gmailInvalidField = await page.$('input[class="whsOnd zHQkBf"][aria-invalid="true"]').catch(() => null);
    const passwordField = await page.$('input[class="whsOnd zHQkBf"][type="password"]').catch(() => null)
    const onboardingButton = await page.$('[class="zp-button zp_zUY3r zp_OztAP zp_lshSd"]').catch(() => null)
    const apolloSkipButton = await page.$('[class="zp-button zp_zUY3r zp_MCSwB"]').catch(() => null)
    const close = await page.$('[class="zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_rzbAy"]').catch(() => null)
    const  url = page.url();

    if (gmailInvalidField) {
      throw new AppError(taskID, 'failed to login, invalid input field')

    } else if(passwordField) {
      await passwordField.type(account.password)
        .then(() => { io.emit('apollo', {taskID, message: "typed password into field"}) });
      
        const nextButton = await page.$('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 qIypjc TrZEUc lw1w4b"]');
      if (!nextButton) throw new AppError(taskID, 'failed to login, could not find next button to progress to password page');
      await nextButton.click({delay: 1000})
        .then(() => { io.emit('apollo', {taskID, message: "clicked on next button"}) });
      counter = 0

    } else if (heading && heading.includes('Verify')) {
      if (url.includes('recaptcha')) {
        // accounts.google.com/v3/signin/challenge/recaptcha
        throw new AppError(taskID, 'failed to login, gmail requires recapcha auth')
      }
      if (!account.recoveryEmail) { throw new AppError(taskID, 'failed to login, recover email not provided')}
      await verifyGmail(taskID, browserCTX, account.recoveryEmail)
        .then(() => { io.emit('apollo', {taskID, message: "verified gmail account"}) });
      counter = 0

    } else if (heading && heading.includes('Sign in')) {
      const confirmButton = await page.$$('[class="VfPpkd-Jh9lGc"]')
      if (!confirmButton.length) throw new AppError(taskID, 'failed to confirm auth');
      await confirmButton[1].click()
        .then(() => { io.emit('apollo', {taskID, message: "clicked on apollo confirmation button"}) });
      counter = 0

    } else if (onboardingButton) {
      await onboardingButton.click({delay:1000})
        .then(() => { io.emit('apollo', {taskID, message: "clicked 'skip' button on apollo onboarding page"}) });
      counter = 0

    } else if (apolloSkipButton) {
      await apolloSkipButton.click({delay:1000})
        .then(() => { io.emit('apollo', {taskID, message: "clicked 'skip' button on popup in apollo"}) });
      counter = 0

    } else if (close) {
      await close.click({delay:1000})
        .then(() => { io.emit('apollo', {taskID, message: "clicked on popup close button in apollo"}) });
      counter = 0

    } else if (url.includes('signup-success')) {
      await page.goto('https://app.apollo.io/')
        .then(() => { io.emit('apollo', {taskID, message: "navigated to apollo dashboard"}) });
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

    await delay(3000)
  }
}

// (FIX) complete func
export const apolloGmailLogin = async (taskID: string, browserCTX: BrowserContext, account: Partial<IAccount>) => {

  if (!account.email || !account.password) throw new AppError(taskID, 'failed to login, credentials missing');

  await visitGmailLoginAuthPortal(taskID, browserCTX)
    .then(() => { io.emit('apollo', {taskID, message: "navigated to gmail auth portal"}) });

  await gmailAuth(taskID, browserCTX, account)
    .then(() => { io.emit('apollo', {taskID, message: "prepared browser for login"}) });
}

export const apolloGmailSignup = async (taskID: string, browserCTX: BrowserContext, account: Partial<IAccount>) => {
  if (!account.email || !account.password) throw new AppError(taskID, 'failed to login, credentials missing');
  
  const page = browserCTX.page

  await apolloInitSignup(taskID, browserCTX)
    .then(() => { io.emit('apollo', {taskID, message: "prepared browser for signup"}) });

  const gmailSignupButton = await page.$('button[id="google-oauth-button"]')
  if (!gmailSignupButton) throw new AppError(taskID, 'failed to signup, could not find gmail signup button')
  
  await gmailSignupButton.click({delay: 1000})
    .then(() => { io.emit('apollo', {taskID, message: "navigated to gmail auth portal"}) });

  await gmailAuth(taskID, browserCTX, account)
    .then(() => { io.emit('apollo', {taskID, message: "completed gmail auth for signup"}) });
}

