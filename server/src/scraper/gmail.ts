import { Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import { apolloInitSignup, scraper } from './scraper';
import { IAccount } from '../database/models/accounts';
import { visitApolloLoginPage } from './apollo';
import { query } from 'express';
import { delay, hideDom, waitForNavHideDom } from './util';

const verifyGmail = async (recoverEmail: string) => {
  const page = scraper.page() as Page;

  const verificationMethods = await page.waitForSelector('div[class="vxx8jf"]', {visible: true, timeout: 5000})
    .then(async () => {
      return await page.$$('div[class="vxx8jf"]')
    })
    .catch(() => null)

  let confirmRecovEmailIdx = -1;
  // VfPpkd-RLmnJb
  // VfPpkd-Jh9lGc
  if (!verificationMethods || !verificationMethods.length) throw new Error('failed to get verification methods')

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

  if (confirmRecovEmailIdx === -1) throw new Error('failed to find "confirm email" recovery method')

  await verificationMethods[confirmRecovEmailIdx].click()

  const recovEmailInputEl = await page.waitForSelector('input[class="whsOnd zHQkBf"]', {visible: true, timeout: 5000}).catch(() => null);
  if (!recovEmailInputEl) throw new Error('failed to find recovery email input')

  await recovEmailInputEl.type(recoverEmail)

  const newButton = await page.$('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 qIypjc TrZEUc lw1w4b"]')
  if (!newButton) throw new Error('failed to find next button')

  await newButton.click()
}

export const visitGmailLoginAuthPortal = async () => {
  const page = scraper.page() as Page

  await scraper.visit('https://app.apollo.io/#/login')
  .then(async () => { await hideDom(page) })

  await page.waitForSelector('input[class="zp_bWS5y zp_J0MYa"][name="email"]', { visible: true });

  const gmailLoginButton = await page.$('button[class="zp-button zp_zUY3r zp_n9QPr zp_MCSwB zp_eFcMr zp_grScD"]')
  if (!gmailLoginButton) throw new Error('failed to login, could not find google login button')
  await gmailLoginButton.click({delay: 1000})
    // .then(async () => { 
    //   await waitForNavHideDom(page) 
    // })
}

const gmailAuth = async (account: Partial<IAccount>) => {
  if (!account.email || !account.password) throw new Error('failed to login, credentials missing');

  const page = scraper.page() as Page;

  const emailField = await page.waitForSelector('input[class="whsOnd zHQkBf"][type="email"]', { visible: true, timeout: 10000 });
  if (!emailField) throw new Error('failed to login, could not input email');
  await emailField.type(account.email)

  const nextButton1 = await page.$('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 qIypjc TrZEUc lw1w4b"]');
  if (!nextButton1) throw new Error('failed to login, could not find next button to progress to password page');
  await nextButton1.click({delay: 1000});

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
      throw new Error('failed to login, invalid input field')

    } else if(passwordField) {
      await passwordField.type(account.password)
      const nextButton = await page.$('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 qIypjc TrZEUc lw1w4b"]');
      if (!nextButton) throw new Error('failed to login, could not find next button to progress to password page');
      await nextButton.click({delay: 1000});
      counter = 0

    } else if (heading && heading.includes('Verify')) {
      if (url.includes('recaptcha')) {
        // accounts.google.com/v3/signin/challenge/recaptcha
        throw new Error('failed to login, gmail requires recapcha auth')
      }
      if (!account.recoveryEmail) { throw new Error('failed to login, recover email not provided')}
      await verifyGmail(account.recoveryEmail)
      counter = 0

    } else if (heading && heading.includes('Sign in')) {
      const confirmButton = await page.$$('[class="VfPpkd-Jh9lGc"]')
      if (!confirmButton.length) throw new Error('failed to confirm auth');
      await confirmButton[1].click();
      counter = 0

    } else if (onboardingButton) {
      await onboardingButton.click({delay:1000})
      counter = 0

    } else if (apolloSkipButton) {
      await apolloSkipButton.click({delay:1000})
      counter = 0

    } else if (close) {
      await close.click({delay:1000})
      counter = 0

    } else if (url.includes('signup-success')) {
      await scraper.visit('https://app.apollo.io/')
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
      throw new Error('failed to signup')
    } else {
      counter++
    }

    await delay(3000)
  }
}

// (FIX) complete func
export const apolloGmailLogin = async (account: Partial<IAccount>) => {
  const page = scraper.page() as Page

  if (!account.email || !account.password) throw new Error('failed to login, credentials missing');

  await visitGmailLoginAuthPortal()

  await gmailAuth(account);
}

export const apolloGmailSignup = async (account: Partial<IAccount>) => {
  if (!account.email || !account.password) throw new Error('failed to login, credentials missing');
  
  const page = scraper.page() as Page

  await apolloInitSignup()
  
  const gmailSignupButton = await page.$('button[id="google-oauth-button"]')
  if (!gmailSignupButton) throw new Error('failed to signup, could not find gmail signup button')
  await gmailSignupButton.click({delay: 1000})


  await gmailAuth(account);
}

