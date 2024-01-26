import { Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import { scraper } from './scraper';
import { IAccount } from '../database/models/accounts';
import { visitApolloLoginPage } from './apollo';
import { query } from 'express';
import { delay, hideDom, waitForNavHideDom } from './util';

const verifyGmail = async (recoverEmail: string) => {
  const page = scraper.page() as Page;

  const verifyStr = await page.evaluate(() => {
    const e = document.querySelector('span[jsslot]')
    // @ts-ignore
    return e ? e.innerText : null
  })
  if (!verifyStr) throw new Error('failed to confirm if verification is required')

  if (verifyStr !== 'Verify that it’s you') throw new Error('verification not required')

  const verificationMethods = await page.$$('div[class="vxx8jf"]')
  let confirmRecovEmailIdx = -1;

  if (!verificationMethods) throw new Error('failed to get verification methods')

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

  const recovEmailInputEl = await page.waitForSelector('input[class="whsOnd zHQkBf"]', {visible: true, timeout: 10000});
  if (!recovEmailInputEl) throw new Error('failed to find recovery email input')

  await recovEmailInputEl.type(recoverEmail)

  const newButton = await page.$('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 qIypjc TrZEUc lw1w4b"]')
  if (!newButton) throw new Error('failed to find next button')

  await newButton.click()
}




// (FIX) complete func
export const apolloGmailLogin = async (account: Partial<IAccount>) => {
  const page = scraper.page() as Page

  if (!account.email || !account.password) throw new Error('failed to login, credentials missing');

  await scraper.visit('https://app.apollo.io/#/login')
    .then(async () => { await hideDom(page) })

  await page.waitForSelector('input[class="zp_bWS5y zp_J0MYa"][name="email"]', { visible: true });
  
  const gmailLoginButton = await page.$('button[class="zp-button zp_zUY3r zp_n9QPr zp_MCSwB zp_eFcMr zp_grScD"]')
  if (!gmailLoginButton) throw new Error('failed to login, could not find google login button')
  await gmailLoginButton.click({delay: 1000})
    .then(async () => { 
      await waitForNavHideDom(page) 
    })

  const emailField = await page.waitForSelector('input[class="whsOnd zHQkBf"][type="email"]', { visible: true, timeout: 10000 });
  if (!emailField) throw new Error('failed to login, could not input email');
  await emailField.type(account.email)

  const nextButton1 = await page.$('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 qIypjc TrZEUc lw1w4b"]');
  if (!nextButton1) throw new Error('failed to login, could not find next button to progress to password page');
  await nextButton1.click({delay: 1000});

  
  // accounts.google.com/v3/signin/challenge/recaptcha

  let counter = 0
  while (counter <= 5) {
    const passwordField = await page.$('input[class="whsOnd zHQkBf"][type="password"]').catch(() => null)
    const onboardingButton = await page.$('[class="zp-button zp_zUY3r zp_OztAP zp_lshSd"]').catch(() => null)
    const apolloSkipButton = await page.$('[class="zp-button zp_zUY3r zp_MCSwB"]').catch(() => null)
    const close = await page.$('[class="zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_rzbAy"]').catch(() => null)
    const  url = page.url();

    if (passwordField) {
      await passwordField.type(account.password)
      const nextButton2 = await page.$('button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 qIypjc TrZEUc lw1w4b"]');
      if (!nextButton2) throw new Error('failed to login, could not find next button to progress to password page');
      await nextButton2.click({delay: 1000});
      counter = 0
    // } else if (enableAuth) {
    //   await enableAuth.click({delay: 1000});
    //   counter = 0
    // } else if (updatesButton) {
    //   await updatesButton.click({delay: 1000})
    //   counter = 0
    // }  else if (staySignedInButton) {
    //   await staySignedInButton.click({delay:1000})
    //   counter = 0
    } else if (onboardingButton) {
      await onboardingButton.click({delay:1000})
      counter = 0
    } else if (apolloSkipButton) {
      await apolloSkipButton.click({delay:1000})
      counter = 0
    } else if (close) {
      await close.click({delay:1000})
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
    } else {
      counter++
    }
    await delay(3000)
  }


    // ========== check if verification is needed ==========

    // const verifyStr = await page.evaluate(() => {
    //   const e = document.querySelector('span[jsslot]')
    //   // @ts-ignore
    //   return e ? e.innerText : null
    // })
  
    // // recovery email
    // if (verifyStr === "Verify that it’s you") {
    //   if (!account.recoveryEmail) throw new Error('failed to verify email')
    //   await verifyGmail(account.recoveryEmail)
    // }

     // ===================================================
}

