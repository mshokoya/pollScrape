import { Page } from 'puppeteer-extra-plugin/dist/puppeteer';
type HE = HTMLElement

export const apolloDoc = async (page: Page) => {

  return await page.evaluate(async () => {
    const na = 'N/A'
    const el = {
      columns: {
        name: {
          name: (columnEl: HE) => (isEl(columnEl.querySelector('.zp_xVJ20 > a') as HE) as HE).innerHTML || na,
          linkedin: (columnEl: HE) => (isEl(columnEl.getElementsByClassName('zp-link zp_OotKe')[0] as HE) as any).href || na,
        },
        title: (columnEl: HE) => (isEl(columnEl.querySelector('.zp_Y6y8d') as HE) as HE).innerHTML || na,
        company: {
          name: (columnEl: HE) => (isEl(columnEl.getElementsByClassName('zp_WM8e5 zp_kTaD7')[0] as HE) as HE).innerHTML || na,
          socialsList: (columnEl: HE) => columnEl.getElementsByClassName('zp-link zp_OotKe') || []
        },
        location: (columnEl: HE) => (isEl(columnEl.querySelector('.zp_Y6y8d') as HE) as HE).innerHTML || na,
        employees: (columnEl: HE) => (isEl(columnEl.querySelector('.zp_Y6y8d') as HE) as HE).innerHTML || na,
        email: {
          emailButton: (columnEl: HE) => columnEl.getElementsByClassName('zp-button zp_zUY3r zp_jSaSY zp_MCSwB zp_IYteB')[0],
          emailText: (columnEl: HE) => (isEl(columnEl.getElementsByClassName('zp-link zp_OotKe zp_Iu6Pf')[0] as HE) as HE).innerHTML || na,
          noEmailText: (columnEl: HE) => (isEl(columnEl.getElementsByClassName('zp_RIH0H zp_Iu6Pf')[0] as HE) as HE).innerHTML || na
        },
        industry: (columnEl: HE) => (isEl(columnEl.getElementsByClassName('zp_PHqgZ zp_TNdhR')[0] as HE) as HE).innerHTML || na,
        keywords: (columnEl: Element) => columnEl.getElementsByClassName('zp_yc3J_ zp_FY2eJ')
      },
      nav: {
        nextPageButton: () => document.getElementsByClassName('zp-button zp_zUY3r zp_MCSwB zp_xCVC8')[2],
        prevPageButton: () => document.getElementsByClassName('zp-button zp_zUY3r zp_MCSwB zp_xCVC8')[1],
        toggleFilterVisibility: () => document.getElementsByClassName('zp-button zp_zUY3r zp_MCSwB zp_xCVC8')[0]
      },
      ad: {
        isAdRow: (trEl: HE) => (isEl(trEl) as HE).className === "zp_DNo9Q zp_Ub5ME",
      },
      errors: {
        freePlan: {
          error:() => document.getElementsByClassName('zp_lMRYw zp_YYCg6 zp_iGbgU')[0],
          closeButton: () => (document.getElementsByClassName('zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_c5Xci')[0] as HE).click()
        },
        limitedVersionError: () => document.getElementsByClassName('apolloio-css-vars-reset zp zp-modal zp_iDDtd zp_APRN8 api-error-modal')[0]
      }
    }
  
    const isEl = (el: HTMLElement): HTMLElement | {} => el ? el : {}
  
    const scraperStatus = (() => {
      let shouldContinueRunning = true;
  
      return {
        shouldContinueRunning: () => shouldContinueRunning,
        stopRunningScraper: () => {
          shouldContinueRunning = false;
        },
        reset: () => {
          shouldContinueRunning = true;
        }
      }
    })()
  
  
    const scrapeSingleRow = async (tbody: Element) => {
      let tr = tbody.childNodes[0] as HE
  
      // there are rows asking users to upgrade plan. if we're in this row then skip
      if (el.ad.isAdRow(tr)) {
        tr = tbody.childNodes[1] as HE
      };
  
      const nameColumn = scrapeNameColumn(tr.childNodes[0] as HE);
      const titleColumn = scrapeTitleColumn(tr.childNodes[1] as HE);
      const companyColumn = scrapeCompanyColumn(tr.childNodes[2] as HE); // obj
      const locationColumn = scrapeLocationColumn(tr.childNodes[4] as HE);
      const employeesColumn = scrapeEmployeesColumn(tr.childNodes[5] as HE);
      const emailColumn = await scrapeEmailColumn(tr.childNodes[6] as HE);
      const industryColumn = scrapeIndustryColumn(tr.childNodes[7] as HE);
      const keywordsColumn = scrapeKeywordsColumn(tr.childNodes[8] as HE); // list
    
      return {
        'name': `"${nameColumn.name}"`,
        'linkedin': `"${nameColumn.linkedin}"`, 
        'title': `"${titleColumn}"`,
        'website': `"${companyColumn.companyWebsite}"`,
        'company linkedin': `"${companyColumn.companyLinkedin}"`,
        'twitter': `"${companyColumn.companyTwitter}"`,
        'facebook': `"${companyColumn.companyFacebook}"`,
        'location': `"${locationColumn}"`,
        'employees': `"${employeesColumn}"`,
        'email': `"${emailColumn}"`,
        'industry': `"${industryColumn}"`,
        'keywords': `"${keywordsColumn}"`
      }
    }
    
    const scrapeSinglePage = async () => {
      
      const allRows = getRows();
      const data = [];
    
      for (let row of allRows) {
        let shouldContinueRunning = scraperStatus.shouldContinueRunning();
        if (!shouldContinueRunning) break;
        const singleRow = await scrapeSingleRow(row)
        if (singleRow) data.push(singleRow);
      }
      
      return data
    }
    
    const scrapeAllPages = async () => {
      let freePlanError = el.errors.freePlan.error()
      let limitedVersionError = el.errors.limitedVersionError()
      let shouldContinueRunning = scraperStatus.shouldContinueRunning();
      const data = []
    
      // next page loop
      while ( !freePlanError && !limitedVersionError && shouldContinueRunning) {
        const pageRows = await scrapeSinglePage();
        data.push(pageRows);
        freePlanError = el.errors.freePlan.error();
        limitedVersionError = el.errors.limitedVersionError();
        shouldContinueRunning = scraperStatus.shouldContinueRunning();
        
        if (!freePlanError && !limitedVersionError && shouldContinueRunning) {
          await waitForNextPageToLoad(pageRows);
        }
      }
  
      freePlanError ? el.errors.freePlan.closeButton() : null
      // reset stop button;
      scraperStatus.reset()
  
      return data
    }
  
    function waitForNextPageToLoad(prevRows: { name: string; linkedin: string; title: string; }[]) {
      return new Promise<void>(async (resolve) => {
        const nextPageButton = document.getElementsByClassName('zp-icon mdi zp_dZ0gM zp_j49HX zp_efSQj')[1] as HE // finds next page button

        nextPageButton.click() // clicks next page button
  
        // the loop is used to wait for next page to load (verifies next page loaded when first row of content has changed)
        while (true) {
          // waits 3 seconds
          await sleep(3000)
          const freePlanError = document.getElementsByClassName('zp_lMRYw zp_YYCg6 zp_iGbgU')[0];
          const limitedVersionError = document.getElementsByClassName('apolloio-css-vars-reset zp zp-modal zp_iDDtd zp_APRN8 api-error-modal')[0]
          // gets first row on table data (while next page is loading, the previous page DOM element is visible)
          const nextRow = scrapeSingleRow(getSingleRow(0))
          // compare the previous page first row data to current pages first row data to see if page has changes yet
          const sameRow = isSameRow(prevRows[0], nextRow)
          // TODO check that its not last page
          // if we get a page error or page is different we break out the loop (closing the function) 
          if (!sameRow || freePlanError || limitedVersionError) {
            break
          };
        }
        resolve();
      });
    }
    
    const scrapeNameColumn = (nameColumn: HE) => ({
      name: el.columns.name.name(nameColumn),
      linkedin: el.columns.name.linkedin(nameColumn)
    })
    
    const scrapeTitleColumn = (titleColumn: HE) => (el.columns.title(titleColumn))
    
    const scrapeCompanyColumn = (companyColumn: HE) => {
      return {
        companyName: el.columns.company.name(companyColumn) || na,
        companyWebsite: na,
        companyLinkedin: na,
        companyTwitter: na,
        companyFacebook: na,
        ...Array.from(el.columns.company.socialsList(companyColumn))
          .reduce((a, c) => ({
            ...a, 
            // @ts-ignore
            ...populateSocialsLinks((c).href)
          }), {})
      }
    }
    
    const scrapeLocationColumn = (locationColumn: HE) => (el.columns.location(locationColumn))
    
    const scrapeEmployeesColumn = (employeesColumn: HE) => (el.columns.employees(employeesColumn))
  
    
    const scrapeEmailColumn = async (emailColumn: HE) => {
      let loopCounter = 0
      let loopEnd = 10
      let email = '';
      const emailButton = emailColumn.getElementsByClassName('zp-button zp_zUY3r zp_jSaSY zp_MCSwB zp_IYteB')[0];
      let emailText = emailColumn.getElementsByClassName('zp-link zp_OotKe zp_Iu6Pf')[0];
      let noEmailText =  emailColumn.getElementsByClassName('zp_RIH0H zp_Iu6Pf')[0];
  
      if (emailButton) {
        (emailButton as HE).click()
  
        // wait for email to populate after clicking button
        while(!noEmailText && !emailText && loopCounter < loopEnd) {
          await sleep(15000)
          loopCounter++
          emailText = emailColumn.getElementsByClassName('zp-link zp_OotKe zp_Iu6Pf')[0];
          noEmailText =  emailColumn.getElementsByClassName('zp_RIH0H zp_Iu6Pf')[0];
        }
        // check if email is populated of if wait ended before field could populate
        if (emailText) {
          email = emailText.innerHTML;
        }
      } else if (emailText) {
        email = emailText.innerHTML;
      }
    
      return !!email
        ? email
        : na
    }
    
    const scrapeIndustryColumn = (industryColumn: HE) => (el.columns.industry(industryColumn))
    
    const scrapeKeywordsColumn = (keywordsColumn: HE) => {
      return Array.from(el.columns.keywords(keywordsColumn))
        .reduce((a, cv) => (a += cv.innerHTML), '')
    }
    
    const populateSocialsLinks = (companyLink: string) => {
      const data: Record<string, string> = {}
      const lowerCompanyLink = companyLink.toLowerCase();
      if (
        !lowerCompanyLink.includes('linkedin.') &&
        !lowerCompanyLink.includes('twitter.') &&
        !lowerCompanyLink.includes('facebook.')
      ) {
        data['companyWebsite'] = companyLink;
      } 
      else if (lowerCompanyLink.includes('linkedin.')) {
        data['companyLinkedin'] = companyLink;
      } else if (lowerCompanyLink.includes('twitter.')) {
        data['companyTwitter'] = companyLink;
      } else if (lowerCompanyLink.includes('facebook.')) {
        data['companyFacebook'] = companyLink;
      }
  
      return data
    }
    
    function sleep(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    const isSameRow = (prev: {}, curr: {}) => {
      return JSON.stringify(prev) === JSON.stringify(curr)
    }
    
    function getSingleRow(idx: number) {
      return document.getElementsByClassName("zp_RFed0")[idx];
    }
    
    function getRows() {
      return document.getElementsByClassName("zp_RFed0")
    }
  
  //  ============================ ACTION ========================
    const data = await scrapeSinglePage()
  
    return data
  });
}
