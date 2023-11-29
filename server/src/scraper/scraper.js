import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import StealthUserAgent from 'puppeteer-extra-plugin-anonymize-ua';
import AdBlockerPlugin from 'puppeteer-extra-plugin-adblocker';

// https://www.zenrows.com/blog/puppeteer-extra#puppeteer-extra-plugin-recaptcha
// https://gist.github.com/jeroenvisser101/636030fe66ea929b63a33f5cb3a711ad

puppeteer.use(StealthPlugin());
puppeteer.use(StealthUserAgent({
  stripHeadless: true,
  makeWindows: true
}));
puppeteer.use(AdBlockerPlugin({ blockTrackers: true }))

// login - https://app.apollo.io/#/login

export const scraper = () => {
  let browser;
  let page;
  
  return {
    launchBrowser: async () => {
      browser = await puppeteer.launch({headless: false})
      await browser.newPage()
    },
    visit: async (url) => {
      const v = await browser.goto(url);
      page = v
    },
    close: async () => {
      await browser.close();
    },
    page: () => page,
    browser: () => browser,
  }
}

export const visitApollo = async (scraper) => {
  await scraper.visit("https://app.apollo.io")
  await page.waitForNavigation();
}

export const apolloLogin = async (scraper, email, pass) => {
  const page = scraper.page()
  emailInput = page.$('input[class="zp_bWS5y zp_J0MYa"][name="email"]');
  passInput = page.$('input[class="zp_bWS5y zp_J0MYa"][name="password"]');
  submitButton = page.$('button[class="zp-button zp_zUY3r zp_H_wRH"][type="submit"]');

  if (emailInput && passInput && submitButton) {
    emailInput.type(email)
    passInput.type(pass)
    await submitButton.click()
    await page.waitForNavigation()
    // await page.waitForSelector(".zp-link .zp_OotKe .zp_Xfylg", { visible: true });
    return true
  }

  return false
}

export const goToApolloSearchUrl = async (scraper, apolloSearchURL) => {
  const page = await scraper.visit(apolloSearchURL);
  await page.waitForSelector(".zp_RFed0", { visible: true });
  // await page.waitForSelector(".zp-link .zp_OotKe .zp_LdIJ3 .zp_FvOcf .zp_FvOcf", { visible: true });
}

// export const apolloScrapePage = async (scraper) => {
//   const page = scraper.page()
//   const data = await page.evaluate(async () => {
//     const data = await scrapeSinglePage(doc);
//     return data
//   });

//   console.log(data)
// }


// ======================================
