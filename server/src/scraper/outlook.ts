// first time apollo signin
// navigated to https://app.apollo.io/#/onboarding-hub/welcome/video
// zp-button zp_zUY3r zp_OztAP zp_lshSd


// inital login first time ---- final step button
// input[class="btn btn-block btn-primary"]

import { BrowserContext, apolloInitSignup, scraper } from "./scraper";
import { delay, hideDom, waitForNavHideDom } from "./util";
import { visitApolloLoginPage } from "./apollo";
import { IAccount } from "../database/models/accounts";
import { io } from "../websockets";
import { AppError } from "../helpers";


export const visitOutlookLoginAuthPortal = async (taskID: string, browserCTX: BrowserContext, hideApolloDom: boolean = false, hidePortalDom: boolean = false) => {
  const page = browserCTX.page
  
  await visitApolloLoginPage(taskID, browserCTX, hideApolloDom)
    .then(() => {  io.emit('apollo', {taskID, message: 'navigated to login page', ok: true}) })

  const microsoftLoginButton = await page.$('button[class="zp-button zp_zUY3r zp_n9QPr zp_MCSwB zp_eFcMr zp_grScD zp_bW01P"]')
  if (!microsoftLoginButton) throw new AppError(taskID, 'failed to login, could not find microsoft login button')
  await microsoftLoginButton.click({delay: 1000})
    .then(async () => { 
      io.emit('apollo', {taskID, message: "clicked on outlooks auth button", ok: true})
      if (hidePortalDom) await waitForNavHideDom(browserCTX) 
    })
}

const outlookAuth = async (taskID: string, {page}: BrowserContext, account: Partial<IAccount>) => {
  if (!account.email || !account.password) throw new AppError(taskID, 'failed to login, credentials missing');

  const emailInputField = await page.$('[class="form-control ltr_override input ext-input text-box ext-text-box"]')
  if (!emailInputField) throw new AppError(taskID, 'failed to login, could not input email');
  await emailInputField.type(account.email)
    .then(() => { io.emit('apollo', {taskID, message: `entered ${account.email} into outlook/hotmail email field`, ok: true}) });
    

  const nextButton1 = await page.$('[class="win-button button_primary button ext-button primary ext-primary"]');
  if (!nextButton1) throw new AppError(taskID, 'failed to login, could not find next button to progress to password page');
  await nextButton1.click({delay: 1000})
    .then(() => { io.emit('apollo', {taskID, message: "clicked the next button", ok: true}) });;

  // await delay(3000)

  let counter = 0
  while (counter <= 5) {
    const passwordField = await page.$('#i0118').catch(() => null)
    const invalidEmail = await page.$('input[class="form-control ltr_override input ext-input text-box ext-text-box has-error ext-has-error"]').catch(() => null)
    const invalidPassword = await  page.$('input[class="form-control input ext-input text-box ext-text-box has-error ext-has-error"]').catch(() => null)
    const staySignedInButton = await page.$('[class="ext-primary ext-button ___pycb3g0 f1apsahp fd0rex f1cpir1z f16eno2h f18r37t4 fzjldvh f1qt38gl f8rakl9 f1g0fpsx f16h1fbs fsgvd33 fmuajgt f17m94t f9q4yqu fhe0td7 fwbpk35 f1wcl2ob f1ltk4hd f1oyfet3 f1k5fftb flu9u7w fa4qi57 f11zj0ky f43o6hn f14894vr f1uush98 fr10sow f1qd3bm6 ftxr058 f1x8m22p f18kyeoj f7uvj51 f1emwz7l fz1xuqi fsrzjhw fur62vr f1f2bxve f19rxy1v f1ks5t5n fg209rd f1hvg9fg f1ik4u3u fd6720t f1u5eihr ftlxw82 fj7y92t f154ob9o fb1y507 f16qlskp f15dqc6l fk9yu7v f1a94zgw fblkvk0 f2ud54c f1rx6zpj f1yeerbk f1apeehu fc5iy9t f1w0w9a7 f4rf09w f1lbyfsq f1jvmnke ffu7u5y fr5cd8s fu7zm6 f1l3iklw f1wctfe5 fr4vimk f171xskp f1mtrtxf ft29jt3 f1dkakdg f7ua2bh f1nxs5xn f1ern45e f1n71otn f1h8hb77 f1deefiw fxdtvjf fytdu2e f14t3ns0 f10ra9hq f11qrl6u f1y2xyjm fjlbh76 f10pi13n f6dzj5z f17mccla fz5stix f1p9o1ba f1sil6mw fmrv4ls f1cmbuwj f1cyt9o8 f1iretw8 fv6p4nl fnsf7x1 f8491dx fj5daoo fnmhfyr f1e35ql2 fatbyko f1grzc83 fb0xa7e fljg2da f1c2uykm f1eqj1rd f7n145z ft0kson ff472gp f4yyc7m fggejwh ft2aflc f9f7vaa fmjaa5u flutoqy f12qb2w f1s9iqzn f1o2wvfq fkbkaou fjk9nze f10kbna7 f9ex757 f1bn7qby f1yx5976 fqv895b"]').catch(() => null)
    const nextButton = await page.$('[class="win-button button_primary button ext-button primary ext-primary"]').catch(() => null)
    const enableAuth = await page.$('input[class="btn btn-block btn-primary"]').catch(() => null)
    const updatesButton = await page.$('[class="btn btn-block btn-primary c_nobdr"]').catch(() => null)
    const onboardingButton = await page.$('[class="zp-button zp_zUY3r zp_OztAP zp_lshSd"]').catch(() => null)
    const apolloSkipButton = await page.$('[class="zp-button zp_zUY3r zp_MCSwB"]').catch(() => null)
    const close = await page.$('[class="zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_rzbAy"]').catch(() => null)
    const  url = page.url();

    if (url.includes('ppsecure')) {
      const nextButton = await page.$('button[type="submit"]').catch(() => null)
      if (!nextButton) throw new AppError(taskID, 'failed to login, please check email (may require a password change)')
      await nextButton.click()
    
    } else if (invalidEmail || invalidPassword) {
      throw new AppError(taskID, 'failed to login, invalid credentials')

    } else if (passwordField) {
      await passwordField.type(account.password)
      if (!nextButton) throw new AppError(taskID, 'failed to login, could not find next button to progress to next page');
      await nextButton.click()
      counter = 0

    } else if (nextButton) {
        await nextButton.click({delay: 1000})
          .then(() => { io.emit('apollo', {taskID, message: "clicked the outlook 'next' button", ok: true}) });
        counter = 0

    } else if (enableAuth) {
      await enableAuth.click({delay: 1000})
        .then(() => { io.emit('apollo', {taskID, message: "click the outlook 'enable' button", ok: true}) });
      counter = 0

    } else if (updatesButton) {
      await updatesButton.click({delay: 1000})
        .then(() => { io.emit('apollo', {taskID, message: "clicked the outlook 'updates' button", ok: true}) })
      counter = 0

    }  else if (staySignedInButton) {
      await staySignedInButton.click({delay:1000})
        .then(() => { io.emit('apollo', {taskID, message: "clicked the 'stay signed in' button", ok: true}) })
      counter = 0

    } else if (onboardingButton) {
      await onboardingButton.click({delay:1000})
        .then(() => { io.emit('apollo', {taskID, message: "clicked the 'continue' button on the apollo onboarding page", ok: true}) })
      counter = 0

    } else if (apolloSkipButton) {
      await apolloSkipButton.click({delay:1000})
        .then(() => { io.emit('apollo', {taskID, message: "clicked the 'skip' button on the apollo dialog", ok: true}) })
      counter = 0

    } else if (close) {
      await close.click({delay:1000})
        .then(() => { io.emit('apollo', {taskID, message: "clicked the 'close'(X) button in apollo for a popup", ok: true}) })
      counter = 0

    } else if (url.includes('signup-success')) {
      await page.goto('https://app.apollo.io/')
        .then(() => { io.emit('apollo', {taskID, message: "navigated to apollo main page after successfull signup with outlook", ok: true}) })
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
}

export const apolloOutlookLogin = async (taskID: string, browserCTX: BrowserContext, account: Partial<IAccount>, hideApolloDom: boolean = false, hidePortalDom: boolean = false) => {
  if (!account.email || !account.password) throw new AppError(taskID, 'failed to login, credentials missing');
  await visitOutlookLoginAuthPortal(taskID, browserCTX, hideApolloDom, hidePortalDom)
    .then(() => { io.emit('apollo', {taskID, message: "navigated to outlooks auth portal", ok: true}) });
    
  await outlookAuth(taskID, browserCTX, account as IAccount)
    .then(() => { io.emit('apollo', {taskID, message: "completed outlook auth login", ok: true}) });
}

export const apolloOutlookSignup = async (taskID: string, browserCTX: BrowserContext, account: Partial<IAccount>) => {
  if (!account.email || !account.password) throw new AppError(taskID, 'failed to login, credentials missing');
  
  const page = browserCTX.page
  
  await apolloInitSignup(taskID, browserCTX)
    .then(() => { io.emit('apollo', {taskID, message: "prepared browser for signup", ok: true}) });

  const microsoftSignupButton = await page.$('button[id="microsoft-oauth-button"]')
  if (!microsoftSignupButton) throw new AppError(taskID, 'failed to signup, could not find microsoft signup button')
  await microsoftSignupButton.click({delay: 1000})
    .then(() => { io.emit('apollo', {taskID, message: "navigated to outlook auth portal", ok: true}) });

  await outlookAuth(taskID, browserCTX, account)
    .then(() => { io.emit('apollo', {taskID, message: "completed outlook auth signup", ok: true}) });
}