import { Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import { scraper } from './scraper';
import { IAccount } from '../database/models/accounts';

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
export const apolloGoogleLogin = async (account: Partial<IAccount>) => {
  const page = scraper.page() as Page

  // apollo login page
  const apolloEmailFieldSelector = 'input[class="zp_bWS5y zp_J0MYa"][name="email"]';
  const apolloPasswordFieldSelector = 'input[class="zp_bWS5y zp_J0MYa"][name="password"]';
  const apolloSubmitButtonSelector = 'button[class="zp-button zp_zUY3r zp_H_wRH"][type="submit"]';

  // gmail button
  const apolloGmailButtonSelector = 'input[class="zp-button zp_zUY3r zp_n9QPr zp_MCSwB zp_eFcMr zp_grScD"]';

  // email
  const gmailEmailFieldSelector = 'input[class="whsOnd zHQkBf"][type="email"]';
  const gmailInvalidEmailSelector = 'input[class="whsOnd zHQkBf"][type="email"][aria-invalid="true"]';

  // password
  const gmailPasswordFieldSelector = 'input[class="whsOnd zHQkBf"][type="password"]';
  const gmailInvalidPasswordSelector = 'input[class="whsOnd zHQkBf"][type="password"][aria-invalid="true"]';

  // email next button
  const gmailNextButtonSelector = 'button[class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc LQeN7 qIypjc TrZEUc lw1w4b"]';

  const emailInput = await page.$(apolloEmailFieldSelector);
  const passInput = await page.$(apolloPasswordFieldSelector);
  const submitButton = await page.$(apolloSubmitButtonSelector);

  if (!!emailInput && !!passInput && !!submitButton) {
    await page.click(apolloGmailButtonSelector);

    await page.waitForSelector(gmailEmailFieldSelector, { visible: true });
    await page.type(gmailEmailFieldSelector, account.email);
    await page.click(gmailNextButtonSelector);

    await page.waitForNavigation({timeout: 5000})

    const isEmailInvalid = await page.$(gmailInvalidEmailSelector)
    if (isEmailInvalid) throw new Error('invalid email (google)')

    const isPasswordInvalid = page.$(gmailPasswordFieldSelector);
    if (!isPasswordInvalid) throw new Error('invalid password (google)')
    
    await page.type(gmailPasswordFieldSelector, account.password);
    await page.click(gmailNextButtonSelector);

    await page.waitForNavigation({timeout: 5000})

    // ========== check if verification is needed ==========
    const verifyStr = await page.evaluate(() => {
      const e = document.querySelector('span[jsslot]')
      // @ts-ignore
      return e ? e.innerText : null
    })
  
    if (verifyStr === "Verify that it’s you") {
      await verifyGmail(account)
    }
     // ===================================================

    // await page.waitForSelector()
    // heres where multiple thing can happen e.g different type of verification or login 

  }
}

