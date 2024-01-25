// first time apollo signin
// navigated to https://app.apollo.io/#/onboarding-hub/welcome/video
// zp-button zp_zUY3r zp_OztAP zp_lshSd


// inital login first time ---- final step button
// input[class="btn btn-block btn-primary"]

import { scraper } from "./scraper";
import { Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import { apolloLoggedOutURLSubstr, delay } from "./util";
import { visitApolloLoginPage } from "./apollo";
import { IAccount } from "../database/models/accounts";

export const apolloOutlookLogin = async (account: Partial<IAccount>) => {
  if (!account.email || !account.password) throw new Error('failed to login, credentials missing');
  
  const page = scraper.page() as Page
  
  await visitApolloLoginPage();

  const microsoftLoginButton = await page.$('button[class="zp-button zp_zUY3r zp_n9QPr zp_MCSwB zp_eFcMr zp_grScD zp_bW01P"]')
  if (!microsoftLoginButton) throw new Error('failed to login, could not find microsoft login button')
  await microsoftLoginButton.click({delay: 1000})

  await outlookAuth(account as IAccount)
}

export const apolloOutlookSignup = async (account: Partial<IAccount>) => {
  if (!account.email || !account.password) throw new Error('failed to login, credentials missing');
  
  const page = scraper.page() as Page
  
  await scraper.visit('https://www.apollo.io/sign-up')
  
  const tsCheckbox = await page.waitForSelector('input[class="PrivateSwitchBase-input mui-style-1m9pwf3"]', {visible: true})
  if (!tsCheckbox) throw new Error('failed to find T&S checkbox')
  await tsCheckbox.click()

  const microsoftSignupButton = await page.$('button[id="microsoft-oauth-button"]')
  if (!microsoftSignupButton) throw new Error('failed to signup, could not find microsoft signup button')
  await microsoftSignupButton.click({delay: 1000})

  await outlookAuth(account )
}

// (FIX) impliment fix for bad path (e.g incorrect email or password)
const outlookAuth = async (account: Partial<IAccount>) => {
  if (!account.email || !account.password) throw new Error('failed to login, credentials missing');
  
  const page = scraper.page() as Page;
  // email input page
  const emailInputField = await page.waitForSelector('[class="form-control ltr_override input ext-input text-box ext-text-box"]', { visible: true, timeout: 10000 });
  if (!emailInputField) throw new Error('failed to login, could not input email');
  await emailInputField.type(account.email)

  const nextButton1 = await page.$('[class="win-button button_primary button ext-button primary ext-primary"]');
  if (!nextButton1) throw new Error('failed to login, could not find next button to progress to password page');
  await nextButton1.click({delay: 1000});

  // password input page
  const passwordInputField = await page.waitForSelector('[class="form-control input ext-input text-box ext-text-box"]', { visible: true, timeout: 10000, });
  if (!passwordInputField) throw new Error('failed to login, could not input password');
  await passwordInputField.type(account.password)

  const nextButton2 = await page.$('[class="win-button button_primary button ext-button primary ext-primary"]');
  if (!nextButton2) throw new Error('failed to login, could not find next button to progress to password page');
  await nextButton2.click({delay: 1000});

  await delay(3000)

  let counter = 0
  while (counter <= 5) {
    const staySignedInButton = await page.$('[class="ext-primary ext-button ___pycb3g0 f1apsahp fd0rex f1cpir1z f16eno2h f18r37t4 fzjldvh f1qt38gl f8rakl9 f1g0fpsx f16h1fbs fsgvd33 fmuajgt f17m94t f9q4yqu fhe0td7 fwbpk35 f1wcl2ob f1ltk4hd f1oyfet3 f1k5fftb flu9u7w fa4qi57 f11zj0ky f43o6hn f14894vr f1uush98 fr10sow f1qd3bm6 ftxr058 f1x8m22p f18kyeoj f7uvj51 f1emwz7l fz1xuqi fsrzjhw fur62vr f1f2bxve f19rxy1v f1ks5t5n fg209rd f1hvg9fg f1ik4u3u fd6720t f1u5eihr ftlxw82 fj7y92t f154ob9o fb1y507 f16qlskp f15dqc6l fk9yu7v f1a94zgw fblkvk0 f2ud54c f1rx6zpj f1yeerbk f1apeehu fc5iy9t f1w0w9a7 f4rf09w f1lbyfsq f1jvmnke ffu7u5y fr5cd8s fu7zm6 f1l3iklw f1wctfe5 fr4vimk f171xskp f1mtrtxf ft29jt3 f1dkakdg f7ua2bh f1nxs5xn f1ern45e f1n71otn f1h8hb77 f1deefiw fxdtvjf fytdu2e f14t3ns0 f10ra9hq f11qrl6u f1y2xyjm fjlbh76 f10pi13n f6dzj5z f17mccla fz5stix f1p9o1ba f1sil6mw fmrv4ls f1cmbuwj f1cyt9o8 f1iretw8 fv6p4nl fnsf7x1 f8491dx fj5daoo fnmhfyr f1e35ql2 fatbyko f1grzc83 fb0xa7e fljg2da f1c2uykm f1eqj1rd f7n145z ft0kson ff472gp f4yyc7m fggejwh ft2aflc f9f7vaa fmjaa5u flutoqy f12qb2w f1s9iqzn f1o2wvfq fkbkaou fjk9nze f10kbna7 f9ex757 f1bn7qby f1yx5976 fqv895b"]').catch(() => null)
    const nextButton3 = await page.$('[class="win-button button_primary button ext-button primary ext-primary"]').catch(() => null)
    const enableAuth = await page.$('input[class="btn btn-block btn-primary"]').catch(() => null)
    const updatesButton = await page.$('[class="btn btn-block btn-primary c_nobdr"]').catch(() => null)
    const onboardingButton = await page.$('[class="zp-button zp_zUY3r zp_OztAP zp_lshSd"]').catch(() => null)
    const apolloSkipButton = await page.$('[class="zp-button zp_zUY3r zp_MCSwB"]').catch(() => null)
    const close = await page.$('[class="zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_rzbAy"]').catch(() => null)
    const  url = page.url();

    if (
      url.includes('app.apollo.io/#/onboarding-hub/queue') ||
      url.includes('app.apollo.io/#/control-center') ||
      url.includes('app.apollo.io/#/sequences') ||
      url.includes('app.apollo.io/#/conversations') ||
      url.includes('app.apollo.io/#/opportunities') ||
      url.includes('app.apollo.io/#/enrichment-status') ||
      url.includes('app.apollo.io/#/settings')
    ) {
      break
    } else if (nextButton3) {
      await nextButton3.click({delay: 1000});
      counter = 0
    } else if (enableAuth) {
      await enableAuth.click({delay: 1000});
      counter = 0
    } else if (updatesButton) {
      await updatesButton.click({delay: 1000})
      counter = 0
    }  else if (staySignedInButton) {
      await staySignedInButton.click({delay:1000})
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
    } else {
      counter++
    }
    await delay(3000)
  }
}