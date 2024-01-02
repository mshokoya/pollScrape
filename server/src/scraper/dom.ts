export const apolloDoc = async (page) => {

  return await page.evaluate(async () => {
    const na = 'N/A'
    const el = {
      columns: {
        name: {
          name: (columnEl: Element) => isEl(columnEl.querySelector('.zp_xVJ20 > a')).innerHTML || na,
          linkedin: (columnEl: Element) => isEl(columnEl.getElementsByClassName('zp-link zp_OotKe')[0]).href || na,
        },
        title: (columnEl: Element) => isEl(columnEl.querySelector('.zp_Y6y8d')).innerHTML || na,
        company: {
          name: (columnEl: Element) => isEl(columnEl.getElementsByClassName('zp_WM8e5 zp_kTaD7')[0]).innerHTML || na,
          socialsList: (columnEl: Element) => columnEl.getElementsByClassName('zp-link zp_OotKe') || []
        },
        location: (columnEl: Element) => isEl(columnEl.querySelector('.zp_Y6y8d')).innerHTML || na,
        employees: (columnEl: Element) => isEl(columnEl.querySelector('.zp_Y6y8d')).innerHTML || na,
        email: {
          emailButton: (columnEl: Element) => columnEl.getElementsByClassName('zp-button zp_zUY3r zp_jSaSY zp_MCSwB zp_IYteB')[0],
          emailText: (columnEl: Element) => isEl(columnEl.getElementsByClassName('zp-link zp_OotKe zp_Iu6Pf')[0]).innerHTML || na,
          noEmailText: (columnEl: Element) => isEl(columnEl.getElementsByClassName('zp_RIH0H zp_Iu6Pf')[0]).innerHTML || na
        },
        industry: (columnEl: Element) => isEl(columnEl.getElementsByClassName('zp_PHqgZ zp_TNdhR')[0]).innerHTML || na,
        keywords: (columnEl: Element) => columnEl.getElementsByClassName('zp_yc3J_ zp_FY2eJ')
      },
      nav: {
        nextPageButton: () => document.getElementsByClassName('zp-button zp_zUY3r zp_MCSwB zp_xCVC8')[2],
        prevPageButton: () => document.getElementsByClassName('zp-button zp_zUY3r zp_MCSwB zp_xCVC8')[1],
        toggleFilterVisibility: () => document.getElementsByClassName('zp-button zp_zUY3r zp_MCSwB zp_xCVC8')[0]
      },
      ad: {
        isAdRow: (trEl: Element) => (isEl(trEl) as Element).className === "zp_DNo9Q zp_Ub5ME",
      },
      errors: {
        freePlan: {
          error:() => document.getElementsByClassName('zp_lMRYw zp_YYCg6 zp_iGbgU')[0],
          closeButton: () => document.getElementsByClassName('zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_c5Xci')[0].click()
        },
        limitedVersionError: () => document.getElementsByClassName('apolloio-css-vars-reset zp zp-modal zp_iDDtd zp_APRN8 api-error-modal')[0]
      }
    }
  
    const isEl = (el: Element) => el ? el : {}
  
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
      let tr = tbody.childNodes[0]
  
      // there are rows asking users to upgrade plan. if we're in this row then skip
      if (el.ad.isAdRow(tr)) {
        tr = tbody.childNodes[1]
      };
  
      const nameColumn = scrapeNameColumn(tr.childNodes[0]);
      const titleColumn = scrapeTitleColumn(tr.childNodes[1]);
      const companyColumn = scrapeCompanyColumn(tr.childNodes[2]); // obj
   
      // const locationColumn = scrapeLocationColumn(tr.childNodes[4]);
      // const employeesColumn = scrapeEmployeesColumn(tr.childNodes[5]);
      // const emailColumn = await scrapeEmailColumn(tr.childNodes[6]);
      // const industryColumn = scrapeIndustryColumn(tr.childNodes[7]);
      // const keywordsColumn = scrapeKeywordsColumn(tr.childNodes[8]); // list
    
      return {
        'name': `"${nameColumn.name}"`,
        'linkedin': `"${nameColumn.linkedin}"`, 
        'title': `"${titleColumn}"`,
        // 'website': `"${companyColumn.companyWebsite}"`,
        // 'company linkedin': `"${companyColumn.companyLinkedin}"`,
        // 'twitter': `"${companyColumn.companyTwitter}"`,
        // 'facebook': `"${companyColumn.companyFacebook}"`,
        // 'location': `"${locationColumn}"`,
        // 'employees': `"${employeesColumn}"`,
        // 'email': `"${emailColumn}"`,
        // 'industry': `"${industryColumn}"`,
        // 'keywords': `"${keywordsColumn}"`
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
  
    function waitForNextPageToLoad(prevRows) {
      return new Promise(async (resolve) => {
        const nextPageButton = document.getElementsByClassName('zp-icon mdi zp_dZ0gM zp_j49HX zp_efSQj')[1] // finds next page button
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
    
    const scrapeNameColumn = (nameColumn) => ({
      name: el.columns.name.name(nameColumn),
      linkedin: el.columns.name.linkedin(nameColumn)
    })
    
    const scrapeTitleColumn = (titleColumn) => (el.columns.title(titleColumn))
    
    const scrapeCompanyColumn = (companyColumn) => {
      return {
        companyName: el.columns.company.name(companyColumn) || na,
        companyWebsite: na,
        companyLinkedin: na,
        companyTwitter: na,
        companyFacebook: na,
        ...Array.from(el.columns.company.socialsList(companyColumn))
          .reduce((a, c) => ({
            ...a, 
            ...populateSocialsLinks(c.href)
          }), {})
      }
    }
    
    const scrapeLocationColumn = (locationColumn) => (el.columns.location(locationColumn))
    
    const scrapeEmployeesColumn = (employeesColumn) => (el.columns.employees(employeesColumn))
  
    
    const scrapeEmailColumn = async (emailColumn) => {
      let loopCounter = 0
      let loopEnd = 10
      let email = '';
      const emailButton = emailColumn.getElementsByClassName('zp-button zp_zUY3r zp_jSaSY zp_MCSwB zp_IYteB')[0];
      let emailText = emailColumn.getElementsByClassName('zp-link zp_OotKe zp_Iu6Pf')[0];
      let noEmailText =  emailColumn.getElementsByClassName('zp_RIH0H zp_Iu6Pf')[0];
  
      if (emailButton) {
        emailButton.click()
  
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
    
    const scrapeIndustryColumn = (industryColumn) => (el.columns.industry(industryColumn))
    
    const scrapeKeywordsColumn = (keywordsColumn) => {
      return Array.from(el.columns.keywords(keywordsColumn))
        .reduce((a, cv) => (a += cv.innerHTML), '')
    }
    
    const populateSocialsLinks = (companyLink) => {
      const data = {}
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
    
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    const isSameRow = (prev, curr) => {
      return JSON.stringify(prev) === JSON.stringify(curr)
    }
    
    function getSingleRow(idx) {
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
