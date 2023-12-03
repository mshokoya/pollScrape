const el = (document) => ({
  columns: {
    name: {
      name: (columnEl) => isEl(columnEl.querySelector('.zp_xVJ20 > a')).innerHTML || na,
      linkedin: (columnEl) => isEl(columnEl.getElementsByClassName('zp-link zp_OotKe')[0]).href || na,
    },
    title: (columnEl) => isEl(columnEl.querySelector('.zp_Y6y8d')).innerHTML || na,
    company: {
      name: (columnEl) => isEl(columnEl.getElementsByClassName('zp_WM8e5 zp_kTaD7')[0]).innerHTML || na,
      socialsList: (columnEl) => columnEl.getElementsByClassName('zp-link zp_OotKe') || []
    },
    location: (columnEl) => isEl(columnEl.querySelector('.zp_Y6y8d')).innerHTML || na,
    employees: (columnEl) => isEl(columnEl.querySelector('.zp_Y6y8d')).innerHTML || na,
    email: {
      emailButton: (columnEl) => columnEl.getElementsByClassName('zp-button zp_zUY3r zp_jSaSY zp_MCSwB zp_IYteB')[0],
      emailText: (columnEl) => isEl(columnEl.getElementsByClassName('zp-link zp_OotKe zp_Iu6Pf')[0]).innerHTML || na,
      noEmailText: (columnEl) => isEl(columnEl.getElementsByClassName('zp_RIH0H zp_Iu6Pf')[0]).innerHTML || na
    },
    industry: (columnEl) => isEl(columnEl.getElementsByClassName('zp_PHqgZ zp_TNdhR')[0]).innerHTML || na,
    keywords: (columnEl) => columnEl.getElementsByClassName('zp_yc3J_ zp_FY2eJ')
  },
  nav: {
    nextPageButton: () => document.getElementsByClassName('zp-button zp_zUY3r zp_MCSwB zp_xCVC8')[2],
    prevPageButton: () => document.getElementsByClassName('zp-button zp_zUY3r zp_MCSwB zp_xCVC8')[1],
    toggleFilterVisibility: () => document.getElementsByClassName('zp-button zp_zUY3r zp_MCSwB zp_xCVC8')[0]
  },
  ad: {
    isAdRow: (trEl) => isEl(trEl.className) === "zp_DNo9Q zp_Ub5ME",
  },
  errors: {
    freePlan: {
      error:() => document.getElementsByClassName('zp_lMRYw zp_YYCg6 zp_iGbgU')[0],
      closeButton: () => document.getElementsByClassName('zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_c5Xci')[0].click()
    },
    limitedVersionError: () => document.getElementsByClassName('apolloio-css-vars-reset zp zp-modal zp_iDDtd zp_APRN8 api-error-modal')[0]
  }
})

// ==============================
export const scraperStatus = (() => {
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const isSameRow = (prev, curr) => {
  return JSON.stringify(prev) === JSON.stringify(curr)
}

function getSingleRow(document, idx) {
  return document.getElementsByClassName("zp_RFed0")[idx];
}

const getRows = (document) => {
  return document.getElementsByClassName("zp_RFed0");
}

export const scrapeSinglePage = async (doc) => {
  const allRows = getRows(doc);
  const data = [];

  for (let row of allRows) {
    let shouldContinueRunning = scraperStatus.shouldContinueRunning();
    if (!shouldContinueRunning) break;
    const singleRow = await scrapeSingleRow(doc, row)
    if (singleRow) data.push(singleRow);
  }
  
  return data
}

const scrapeAllPages = async (doc) => {
  const ell = el(doc)
  let freePlanError = ell.errors.freePlan.error()
  let limitedVersionError = ell.errors.limitedVersionError()
  let shouldContinueRunning = scraperStatus.shouldContinueRunning();
  const data = []

  // next page loop
  while ( !freePlanError && !limitedVersionError && shouldContinueRunning) {
    const pageRows = await scrapeSinglePage(doc);
    data.push(pageRows);
    freePlanError = ell.errors.freePlan.error();
    limitedVersionError = ell.errors.limitedVersionError();
    shouldContinueRunning = scraperStatus.shouldContinueRunning();
    
    if (!freePlanError && !limitedVersionError && shouldContinueRunning) {
      await waitForNextPageToLoad(doc, pageRows);
    }
  }

  freePlanError ? ell.errors.freePlan.closeButton() : null
  // reset stop button;
  scraperStatus.reset()

  return data
}

function waitForNextPageToLoad(document, prevRows) {
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
      const nextRow = scrapeSingleRow(getSingleRow(document, 0))
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

const scrapeSingleRow = async (doc, tbody) => {
  const ell = el(doc)
  let tr = tbody.childNodes[0]

  // there are rows asking users to upgrade plan. if we're in this row then skip
  if (ell.ad.isAdRow(tr)) {
    tr = tbody.childNodes[1]
  };

  const nameColumn = scrapeNameColumn(doc, tr.childNodes[0]);
  const titleColumn = scrapeTitleColumn(doc, tr.childNodes[1]);
  const companyColumn = scrapeCompanyColumn(doc, tr.childNodes[2]); // obj
  // const quickActionsColumn =  tdList.childNodes[3];
  const locationColumn = scrapeLocationColumn(doc, tr.childNodes[4]);
  const employeesColumn = scrapeEmployeesColumn(doc, tr.childNodes[5]);
  const emailColumn = await scrapeEmailColumn(tr.childNodes[6]);
  const industryColumn = scrapeIndustryColumn(doc, tr.childNodes[7]);
  const keywordsColumn = scrapeKeywordsColumn(doc, tr.childNodes[8]); // list

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


// ==============================

const scrapeNameColumn = (doc, nameColumn) => {
  const ell = el(doc)

  return {
  name: ell.columns.name.name(nameColumn),
  linkedin: ell.columns.name.linkedin(nameColumn)
  }
}

const scrapeTitleColumn = (doc, titleColumn) => {
  const ell = el(doc)
  return ell.columns.title(titleColumn)
}

const scrapeCompanyColumn = (doc, companyColumn) => {
  const ell = el(doc)
  return {
    companyName: ell.columns.company.name(companyColumn) || na,
    companyWebsite: na,
    companyLinkedin: na,
    companyTwitter: na,
    companyFacebook: na,
  ...Array.from(ell.columns.company.socialsList(companyColumn))
    .reduce((a, c) => ({
      ...a, 
      ...populateSocialsLinks(c.href)
    }), {})
  }
}

const scrapeLocationColumn = (doc, locationColumn) => {
  const ell = el(doc)
  ell.columns.location(locationColumn)
}

const scrapeEmployeesColumn = (doc, employeesColumn) => {
  const ell = el(doc)
  return ell.columns.employees(employeesColumn)
}


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
      await sleep(5000)
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

const scrapeIndustryColumn = (doc, industryColumn) => {
  const ell = el(doc)
  return ell.columns.industry(industryColumn)
}

const scrapeKeywordsColumn = (doc, keywordsColumn) => {
  const ell = el(doc)
  return Array.from(ell.columns.keywords(keywordsColumn))
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