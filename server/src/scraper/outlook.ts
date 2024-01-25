import { scraper } from "./scraper";
import { Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import { apolloLoggedOutURLSubstr } from "./util";
import { visitApolloLoginPage } from "./apollo";

export const apolloOutlookLogin = async (email: string, password: string) => {
  const page = scraper.page() as Page

  if (!page.url().includes(apolloLoggedOutURLSubstr)) {
    await visitApolloLoginPage()
  }

  // apollo login page (use to make sure navigated to login page)
  const apolloEmailFieldSelector = 'input[class="zp_bWS5y zp_J0MYa"][name="email"]';
  const apolloPasswordFieldSelector = 'input[class="zp_bWS5y zp_J0MYa"][name="password"]';
  const apolloSubmitButtonSelector = 'button[class="zp-button zp_zUY3r zp_H_wRH"][type="submit"]';

  // outlook login page 
  const outlookButtonSelector = '[class="zp-button zp_zUY3r zp_n9QPr zp_MCSwB zp_eFcMr zp_grScD zp_bW01P"]';
  const emailInputFieldSelector = '[class="form-control ltr_override input ext-input text-box ext-text-box"]';
  const nextButton1 = '[class="win-button button_primary button ext-button primary ext-primary"]';
  const passwordFieldSelector = '[class="form-control input ext-input text-box ext-text-box"]';
  const nextButton2 = nextButton1;
  
  const staySignedInButtonSelector = '.win-button, .button_primary, .button, .ext-button, .primary, .ext-primary';
  
  const apolloLoggedInSearchBarSelector = '.zp_bWS5y, .zp_J0MYa, .zp_EIhoD, zp_EYQkR';

  const emailInput = await page.$(apolloEmailFieldSelector);
  const passInput = await page.$(apolloPasswordFieldSelector);
  const submitButton = await page.$(apolloSubmitButtonSelector);
  
  if (!!emailInput && !!passInput && !!submitButton) {
    await page.click(outlookButtonSelector);

    // email input page
    await page.waitForSelector(emailInputFieldSelector, { visible: true });
    await page.type(emailInputFieldSelector, email);
    await page.waitForTimeout(1000)
    await page.click(nextButton1);

    // password input page
    await page.waitForSelector(passwordFieldSelector, { visible: true });
    await page.type(passwordFieldSelector, password);
    await page.waitForTimeout(1000)
    await page.click(nextButton2);

    // Stay signed in page
    await page.waitForTimeout(3000)
    await page.waitForSelector(staySignedInButtonSelector);
    await page.click(staySignedInButtonSelector);

    // apollo searchbar (logged in) (success)
    await page.waitForSelector(apolloLoggedInSearchBarSelector, { visible: true, timeout: 10000 })
  }
}