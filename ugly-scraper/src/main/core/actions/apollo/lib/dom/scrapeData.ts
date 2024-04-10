//@ts-nocheck

import { Page } from 'puppeteer-extra-plugin/dist/puppeteer'
type HE = HTMLElement

export const apolloDoc = async (page: Page) => {
  return await page.evaluate(async () => {
    window.na = 'N/A'
    window.el = {
      columns: {
        name: {
          name: (columnEl: HE) =>
            (isEl(columnEl.querySelector('.zp_xVJ20 > a') as HE) as HE).innerHTML || na,
          linkedin: (columnEl: HE) =>
            (isEl(columnEl.getElementsByClassName('zp-link zp_OotKe')[0] as HE) as any).href || na
        },
        title: (columnEl: HE) =>
          (isEl(columnEl.querySelector('.zp_Y6y8d') as HE) as HE).innerHTML || na,
        company: {
          name: (columnEl: HE) =>
            (isEl(columnEl.getElementsByClassName('zp_WM8e5 zp_kTaD7')[0] as HE) as HE).innerHTML ||
            na,
          socialsList: (columnEl: HE) => columnEl.getElementsByClassName('zp-link zp_OotKe') || []
        },
        location: (columnEl: HE) =>
          (isEl(columnEl.querySelector('.zp_Y6y8d') as HE) as HE).innerHTML || na,
        employees: (columnEl: HE) =>
          (isEl(columnEl.querySelector('.zp_Y6y8d') as HE) as HE).innerHTML || na,
        email: {
          emailButton: (columnEl: HE) =>
            columnEl.getElementsByClassName('zp-button zp_zUY3r zp_jSaSY zp_MCSwB zp_IYteB')[0],
          emailText: (columnEl: HE) =>
            (isEl(columnEl.getElementsByClassName('zp-link zp_OotKe zp_Iu6Pf')[0] as HE) as HE)
              .innerHTML || na,
          noEmailText: (columnEl: HE) =>
            (isEl(columnEl.getElementsByClassName('zp_RIH0H zp_Iu6Pf')[0] as HE) as HE).innerHTML ||
            na
        },
        industry: (columnEl: HE) =>
          (isEl(columnEl.getElementsByClassName('zp_PHqgZ zp_TNdhR')[0] as HE) as HE).innerHTML ||
          na,
        keywords: (columnEl: Element) => columnEl.getElementsByClassName('zp_yc3J_ zp_FY2eJ')
      },
      nav: {
        nextPageButton: () =>
          document.getElementsByClassName('zp-button zp_zUY3r zp_MCSwB zp_xCVC8')[2],
        prevPageButton: () =>
          document.getElementsByClassName('zp-button zp_zUY3r zp_MCSwB zp_xCVC8')[1],
        toggleFilterVisibility: () =>
          document.getElementsByClassName('zp-button zp_zUY3r zp_MCSwB zp_xCVC8')[0]
      },
      ad: {
        isAdRow: (trEl: HE) => (isEl(trEl) as HE).className === 'zp_DNo9Q zp_Ub5ME'
      },
      errors: {
        freePlan: {
          error: () => document.getElementsByClassName('zp_lMRYw zp_YYCg6 zp_iGbgU')[0],
          closeButton: () =>
            (
              document.getElementsByClassName(
                'zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_c5Xci'
              )[0] as HE
            ).click()
        },
        limitedVersionError: () =>
          document.getElementsByClassName(
            'apolloio-css-vars-reset zp zp-modal zp_iDDtd zp_APRN8 api-error-modal'
          )[0]
      }
    }

    window.isEl = (el: HTMLElement): HTMLElement | {} => (el ? el : {})

    window.scrapeSingleRow = async (tbody: HE) => {
      const res: Record<string, string> = {}
      const columnNames = document.querySelectorAll('th')

      let tr = tbody.childNodes[0] as HE
      // there are rows asking users to upgrade plan. if we're in this row then skip
      if (el.ad.isAdRow(tr)) {
        tr = tbody.childNodes[1] as HE
      }

      for (let i = 0; i < columnNames.length; i++) {
        switch (columnNames[i].innerText) {
          case 'Name':
            const nameCol = scrapeNameColumn(tr.childNodes[i] as HE)
            res['Name'] = nameCol.name
            res['Firstname'] = nameCol.name.trim().split(' ')[0]
            res['Lastname'] = nameCol.name.trim().split(' ')[1]
            res['Linkedin'] = nameCol.linkedin
            break
          case 'Title':
            res['Title'] = scrapeTitleColumn(tr.childNodes[i] as HE)
            break
          case 'Company':
            const companyCol = scrapeCompanyColumn(tr.childNodes[i] as HE) // obj
            res['Company Name'] = companyCol.companyName
            res['Company Website'] = companyCol.companyWebsite
            res['Company Linkedin'] = companyCol.companyLinkedin
            res['Company Twitter'] = companyCol.companyTwitter
            res['Company Facebook'] = companyCol.companyFacebook
            break
          case 'Quick Actions':
            res['Email'] = await scrapeActionColumn(tr.childNodes[i] as HE)
            break
          case 'Contact Location':
            res['Company Location'] = scrapeLocationColumn(tr.childNodes[i] as HE)
            break
          case '# Employees':
            res['Employees'] = scrapeEmployeesColumn(tr.childNodes[i] as HE)
            break
          case 'Phone':
            res['Phone'] = scrapePhoneColumn(tr.childNodes[i] as HE)
            break
          case 'Industry':
            res['Industry'] = scrapeIndustryColumn(tr.childNodes[i] as HE)
            break
          case 'Keywords':
            res['Keywords'] = scrapeKeywordsColumn(tr.childNodes[i] as HE) // list
        }
      }

      return res
    }

    window.scrapeSinglePage = async () => {
      const allRows = getRows()
      const data = []

      for (const row of allRows) {
        const singleRow = await scrapeSingleRow(row as HE)
        if (singleRow) data.push(singleRow)
      }

      return data
    }

    window.scrapeNameColumn = (nameColumn: HE) => ({
      name: el.columns.name.name(nameColumn),
      linkedin: el.columns.name.linkedin(nameColumn)
    })

    window.scrapeTitleColumn = (titleColumn: HE) => el.columns.title(titleColumn)

    window.scrapeCompanyColumn = (companyColumn: HE) => {
      return {
        companyName: el.columns.company.name(companyColumn) || na,
        companyWebsite: na,
        companyLinkedin: na,
        companyTwitter: na,
        companyFacebook: na,
        ...Array.from(el.columns.company.socialsList(companyColumn)).reduce(
          (a, c) => ({
            ...a,
            // @ts-ignore
            ...populateSocialsLinks(c.href)
          }),
          {}
        )
      }
    }

    window.scrapeLocationColumn = (locationColumn: HE) => el.columns.location(locationColumn)

    window.scrapeEmployeesColumn = (employeesColumn: HE) => el.columns.employees(employeesColumn)

    window.scrapePhoneColumn = (phoneColumn: HE) =>
      phoneColumn.innerText === 'Request Mobile Number' ? na : phoneColumn.innerText

    window.scrapePhoneColumn = (phoneColumn: HE) =>
      phoneColumn.innerText === 'Request Mobile Number' ? na : phoneColumn.innerText

    window.scrapeEmailColumn = async (emailColumn: HE) => {
      let loopCounter = 0
      const loopEnd = 10
      let email = ''
      const emailButton = emailColumn.getElementsByClassName(
        'zp-button zp_zUY3r zp_jSaSY zp_MCSwB zp_IYteB'
      )[0]
      let emailText = emailColumn.getElementsByClassName('zp-link zp_OotKe zp_Iu6Pf')[0]
      let noEmailText = emailColumn.getElementsByClassName('zp_RIH0H zp_Iu6Pf')[0]

      if (emailButton) {
        ;(emailButton as HE).click()

        // wait for email to populate after clicking button
        while (!noEmailText && !emailText && loopCounter < loopEnd) {
          await sleep(15000)
          loopCounter++
          emailText = emailColumn.getElementsByClassName('zp-link zp_OotKe zp_Iu6Pf')[0]
          noEmailText = emailColumn.getElementsByClassName('zp_RIH0H zp_Iu6Pf')[0]
        }
        // check if email is populated of if wait ended before field could populate
        if (emailText) {
          email = emailText.innerHTML
        }
      } else if (emailText) {
        email = emailText.innerHTML
      }

      return email ? email : na
    }

    window.scrapeActionColumn = async (emailColumn: HE) => {
      let loopCounter = 0
      const loopEnd = 3
      let email = ''
      const emailButton: HE | null = emailColumn.querySelector(
        '[class="zp-button zp_zUY3r zp_n9QPr zp_MCSwB"]'
      )
      let emailPopupButton: HE | null = emailColumn.querySelector(
        '[class="zp-button zp_zUY3r zp_hLUWg zp_n9QPr zp_B5hnZ zp_MCSwB zp_IYteB"]'
      )
      let noEmailButton: HE | null = emailColumn.querySelector(
        '[class="zp-button zp_zUY3r zp_BAp0M zp_jSaSY zp_MCSwB zp_IYteB zp_wUX4E zp_wUX4E"]'
      )

      if (emailButton) {
        emailButton.click()
        // wait for email to populate after clicking button
        while (!emailPopupButton && !noEmailButton && loopCounter < loopEnd) {
          await sleep(5000)
          loopCounter++
          emailPopupButton = emailColumn.querySelector(
            '[class="zp-button zp_zUY3r zp_hLUWg zp_n9QPr zp_B5hnZ zp_MCSwB zp_IYteB"]'
          )
          noEmailButton = emailColumn.querySelector(
            '[class="zp-button zp_zUY3r zp_BAp0M zp_jSaSY zp_MCSwB zp_IYteB zp_wUX4E zp_wUX4E"]'
          )

          if (emailPopupButton) {
            emailPopupButton.click()
            email = await emailPopupButtonClick(emailPopupButton)
          } else if (noEmailButton) {
            email = na
          }
        }
      } else if (emailPopupButton) {
        email = await emailPopupButtonClick(emailPopupButton)
      } else if (noEmailButton) {
        email = na
      }

      return email ? email : na
    }

    window.emailPopupButtonClick = async (emailPopupButton: HE) => {
      let email = '-'
      let loopCounter = 0
      const loopEnd = 5
      let emailText = document.getElementsByClassName('zp_t08Bv')[0]

      emailPopupButton.click()

      if (!emailText) {
        while (!emailText && loopCounter < loopEnd) {
          await sleep(1000)
          loopCounter++
          emailText = document.getElementsByClassName('zp_t08Bv')[0]

          if (emailText) {
            email = emailText.innerHTML
          }
        }
      } else if (emailText) {
        email = emailText.innerHTML
      }

      emailPopupButton.click()

      return email
    }

    window.scrapeIndustryColumn = (industryColumn) => el.columns.industry(industryColumn)

    window.scrapeKeywordsColumn = (keywordsColumn) => {
      return Array.from(el.columns.keywords(keywordsColumn)).reduce(
        (a, cv) => (a += cv.innerHTML),
        ''
      )
    }

    window.populateSocialsLinks = (companyLink) => {
      const data: Record<string, string> = {}
      const lowerCompanyLink = companyLink.toLowerCase()
      if (
        !lowerCompanyLink.includes('linkedin.') &&
        !lowerCompanyLink.includes('twitter.') &&
        !lowerCompanyLink.includes('facebook.')
      ) {
        data['companyWebsite'] = companyLink
      } else if (lowerCompanyLink.includes('linkedin.')) {
        data['companyLinkedin'] = companyLink
      } else if (lowerCompanyLink.includes('twitter.')) {
        data['companyTwitter'] = companyLink
      } else if (lowerCompanyLink.includes('facebook.')) {
        data['companyFacebook'] = companyLink
      }

      return data
    }

    window.sleep = (ms) => {
      return new Promise((resolve) => setTimeout(resolve, ms))
    }

    window.getRows = () => {
      return document.getElementsByClassName('zp_RFed0')
    }

    //  ============================ ACTION ========================

    return await scrapeSinglePage()
  })
}
