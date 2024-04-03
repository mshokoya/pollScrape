import { Express } from 'express';
import { apolloScrape } from '../scraper/apollo';
import { initMeta, saveLeadsFromRecovery } from '../database';
import { IMetaData, MetadataModel } from '../database/models/metadata';
import { scraper } from '../scraper/apollo/scraper';
import { AppError, generateID, getDomain, isNumber } from '../util';
import { taskQueue } from '../task_queue';
import { io } from '../websockets';
import { cache } from '../cache';
import { selectAccForScrapingFILO } from '../database/util';
import { IAccount } from '../database/models/accounts';
import { getSavedListAndScrape } from '../scraper/apollo/apollo';


export const scrapeRoutes = (app: Express) => {
  // (FIX) test this function and make sure it works correctly
  app.post('/scrape', async (req, res) => {
    console.log('scrape')

    let metaID: string = req.body.id;
    let metadata: IMetaData;
    let useProxy: boolean = req.body.proxy || false;
    const url = req.body.url;

    try {
      // (FIX) test if works
      if (!url) {
        throw new Error('failed to start scraper, invalid scrape parameters, please provide a valid start and end page')
      }
      
      if (!metaID) {
        metadata = await initMeta(url)
      } else {
        metadata = await MetadataModel.findOne({_id:metaID})
          .then((m) => {
            if (!m) throw new Error('failed to start scraper, could not find metadata')
            return m
          })
      }

      const taskID = generateID()
      await taskQueue.enqueue(
        taskID,
        'apollo',
        'scrape',
        `scrape leads from apollo`,
        {metaID: metaID},
        async () => {
          io.emit( 'apollo', { taskID, taskType: 'scrape', message: 'starting lead scraper' } );
          const browserCTX = await scraper.newBrowser(false)
          await browserCTX?.page.setViewport({ width: 0, height: 0});
          if (!browserCTX) throw new AppError(taskID, 'Failed to scrape, browser could not be started')
          try {
            await apolloScrape(taskID, browserCTX, metadata, useProxy)
          } finally {
            await cache.deleteMeta(metaID)
            await scraper.close(browserCTX)
          }
        }
      )

      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message || 'failed to scrape' , data: null});
    }
  });

}







// const met: any[] = [
//   {
//      "_id":"65eccb634eb65699720c6c38",
//      "url":"https://app.apollo.io/#/people?finderViewId=5b6dfc5a73f47568b2e5f11c&page=1&personTitles[]=manager&organizationNumEmployeesRanges[]=21%2C50",
//      "params":{
//         "people?finderViewId":"5b6dfc5a73f47568b2e5f11c",
//         "page":"1",
//         "personTitles[]":"manager",
//         "organizationNumEmployeesRanges[]":"21,50"
//      },
//      "name":"grumpy-broad-lock",
//      "accounts":[
//         {
//            "accountID":"65a50efc3c13f3197ddecf42",
//            "range":[
//               21,
//               36
//            ]
//         }
//      ],
//      "scrapes":[
//         {
//            "scrapeID":"a937275c-becf-471c-b7bc-4990830d2f29",
//            "listName":"jealous-billowy-jolly-apple"
//         },
//         {
//           "scrapeID":"b678d90b-c275-49ee-beda-1b72634f3346",
//           "listName":"drab-sharp-bored-application"
//         },
//      ],
//      "__v":0
//   },
//   {
//      "_id":"65ece2f08c8b812f48c2e7d1",
//      "url":"https://app.apollo.io/#/people?finderViewId=5b6dfc5a73f47568b2e5f11c&page=1&personTitles[]=manager&organizationNumEmployeesRanges[]=21%2C50",
//      "params":{
//         "people?finderViewId":"5b6dfc5a73f47568b2e5f11c",
//         "page":"1",
//         "personTitles[]":"manager",
//         "organizationNumEmployeesRanges[]":"21,50"
//      },
//      "name":"careful-hissing-secretary",
//      "accounts":[
//         {
//            "accountID":"65a50efc3c13f3197ddecf42",
//            "range":[
//               21,
//               36
//            ]
//         }
//      ],
//      "scrapes":[
//         {
//            "scrapeID":"b678d90b-c275-49ee-beda-1b72634f3346",
//            "listName":"drab-sharp-bored-application"
//         }
//      ],
//      "__v":0
//   },
//   {
//      "_id":"65fdef271f67831f4878f1e1",
//      "url":"https://app.apollo.io/#/people?finderViewId=5b6dfc5a73f47568b2e5f11c&personTitles[]=manager&page=1&organizationNumEmployeesRanges[]=1001%2C2000",
//      "params":{
//         "people?finderViewId":"5b6dfc5a73f47568b2e5f11c",
//         "personTitles[]":"manager",
//         "page":"1",
//         "organizationNumEmployeesRanges[]":"1001,2000"
//      },
//      "name":"nice-savory-football",
//      "accounts":[
        
//      ],
//      "scrapes":[
        
//      ],
//      "__v":0
//   },
//   {
//      "_id":"65fdf024efc4bb6ad3ea61e0",
//      "url":"https://app.apollo.io/#/people?finderViewId=5b6dfc5a73f47568b2e5f11c&personTitles[]=manager&page=1&organizationNumEmployeesRanges[]=1001%2C2000",
//      "params":{
//         "people?finderViewId":"5b6dfc5a73f47568b2e5f11c",
//         "personTitles[]":"manager",
//         "page":"1",
//         "organizationNumEmployeesRanges[]":"1001,2000"
//      },
//      "name":"loose-mammoth-application",
//      "accounts":[
        
//      ],
//      "scrapes":[
        
//      ],
//      "__v":0
//   },
//   {
//      "_id":"65fdf0ae9f32bb7400e205ae",
//      "url":"https://app.apollo.io/#/people?finderViewId=5b6dfc5a73f47568b2e5f11c&personTitles[]=manager&page=1&organizationNumEmployeesRanges[]=1001%2C2000",
//      "params":{
//         "people?finderViewId":"5b6dfc5a73f47568b2e5f11c",
//         "personTitles[]":"manager",
//         "page":"1",
//         "organizationNumEmployeesRanges[]":"1001,2000"
//      },
//      "name":"white-tangy-garage",
//      "accounts":[
        
//      ],
//      "scrapes":[
        
//      ],
//      "__v":0
//   },
//   {
//      "_id":"65fdf1a6006d78ba645cc05c",
//      "url":"https://app.apollo.io/#/people?finderViewId=5b6dfc5a73f47568b2e5f11c&personTitles[]=manager&page=1&organizationNumEmployeesRanges[]=1001%2C2000",
//      "params":{
//         "people?finderViewId":"5b6dfc5a73f47568b2e5f11c",
//         "personTitles[]":"manager",
//         "page":"1",
//         "organizationNumEmployeesRanges[]":"1001,2000"
//      },
//      "name":"billions-crashing-candle",
//      "accounts":[
        
//      ],
//      "scrapes":[
        
//      ],
//      "__v":0
//   },
//   {
//      "_id":"65fdf45c39e5f5fee58756a1",
//      "url":"https://app.apollo.io/#/people?finderViewId=5b6dfc5a73f47568b2e5f11c&personTitles[]=manager&page=1&organizationNumEmployeesRanges[]=1001%2C2000",
//      "params":{
//         "people?finderViewId":"5b6dfc5a73f47568b2e5f11c",
//         "personTitles[]":"manager",
//         "page":"1",
//         "organizationNumEmployeesRanges[]":"1001,2000"
//      },
//      "name":"alive-white-dinner",
//      "accounts":[
        
//      ],
//      "scrapes":[
        
//      ],
//      "__v":0
//   },
//   {
//      "_id":"65fdf4be9d164510141b7fdd",
//      "url":"https://app.apollo.io/#/people?finderViewId=5b6dfc5a73f47568b2e5f11c&personTitles[]=manager&page=1&organizationNumEmployeesRanges[]=1001%2C2000",
//      "params":{
//         "people?finderViewId":"5b6dfc5a73f47568b2e5f11c",
//         "personTitles[]":"manager",
//         "page":"1",
//         "organizationNumEmployeesRanges[]":"1001,2000"
//      },
//      "name":"zealous-loose-zoo",
//      "accounts":[
        
//      ],
//      "scrapes":[
        
//      ],
//      "__v":0
//   },
//   {
//      "_id":"65fdf8e42a15b25f0bf786a8",
//      "url":"https://app.apollo.io/#/people?finderViewId=5b6dfc5a73f47568b2e5f11c&personTitles[]=manager&page=1&organizationNumEmployeesRanges[]=1001%2C2000",
//      "params":{
//         "people?finderViewId":"5b6dfc5a73f47568b2e5f11c",
//         "personTitles[]":"manager",
//         "page":"1",
//         "organizationNumEmployeesRanges[]":"1001,2000"
//      },
//      "name":"limited-stale-honey",
//      "accounts":[
        
//      ],
//      "scrapes":[
        
//      ],
//      "__v":0
//   }
// ]


// {
//   "scrapeID":"a937275c-becf-471c-b7bc-4990830d2f29",
//   "listName":"jealous-billowy-jolly-apple"
// },
// {
//  "scrapeID":"b678d90b-c275-49ee-beda-1b72634f3346",
//  "listName":"drab-sharp-bored-application"
// },





















// const accs: any = [
//   {
//      "_id":"65a50efc3c13f3197ddecf42",
//      "domain":"genzcompany",
//      "accountType":"n/a",
//      "trialTime":"n/a",
//      "isSuspended":false,
//      "email":"tessa@genzcompany.live",
//      "password":"mannyman17",
//      "cookie":"[{\"name\":\"_dd_s\",\"value\":\"rum=0&expire=1708881983377\",\"domain\":\"app.apollo.io\",\"path\":\"/\",\"expires\":1708881988,\"size\":31,\"httpOnly\":false,\"secure\":false,\"session\":false,\"sameSite\":\"Strict\",\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"_leadgenie_session\",\"value\":\"zDbAYdGtPY9a0OLbzbnVmpiH47jZHwar0xbfHuQgGx6N%2BVsF5WbclAfNJhScBAkuNL2j35bU2Y7nPTaV3YoGuDZBNKU4cZG%2BjwNumHpQ0GdwCKZ4B%2F4uaw9Ua3A%2FAfEVywoD3E7OG9dzmW%2FcfvYluPGrRebnfXcrzBzbpORovLDGsPAnBeNg7%2FTTey3NVrd9KDpBo2kd9rJ2LzvVqPb0JrhDEHwX4dncoxqhykfOaI7iGpMh1rTbuEoQwgmshd2A7YH%2FYxVqMZSZZxVZolRZ9Nw6bfAiiw9MqTo%3D--ksGReIuvk8KutXI%2B--NlRk3xCpxefEVfWyNSdHdg%3D%3D\",\"domain\":\"app.apollo.io\",\"path\":\"/\",\"expires\":-1,\"size\":376,\"httpOnly\":true,\"secure\":true,\"session\":true,\"sameSite\":\"None\",\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"amplitude_id_122a93c7d9753d2fe678deffe8fac4cfapollo.io\",\"value\":\"eyJkZXZpY2VJZCI6IjExNjEyOThmLTA2NDktNDhjMS04YTU4LWNkMmYxODhmZjE0ZFIiLCJ1c2VySWQiOiI2NTkyM2JiMGM2N2UwMzAxYWU1OWViMzciLCJvcHRPdXQiOnRydWUsInNlc3Npb25JZCI6MTcwODg4MTA4MTE3NiwibGFzdEV2ZW50VGltZSI6MTcwODg4MTA4MzAxOCwiZXZlbnRJZCI6MSwiaWRlbnRpZnlJZCI6MCwic2VxdWVuY2VOdW1iZXIiOjF9\",\"domain\":\".apollo.io\",\"path\":\"/\",\"expires\":1743441085.336189,\"size\":326,\"httpOnly\":false,\"secure\":false,\"session\":false,\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"X-CSRF-TOKEN\",\"value\":\"Yn_1buS8EiF-11X0g5J6Dspc9WJ42-KJmPDORL0TkMKxjUtt4xquqySs6SM3ZjiJcNW7B9SnpEPS1V9VUKQRAg\",\"domain\":\"app.apollo.io\",\"path\":\"/\",\"expires\":-1,\"size\":98,\"httpOnly\":false,\"secure\":true,\"session\":true,\"sameSite\":\"Lax\",\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"intercom-device-id-dyws6i9m\",\"value\":\"0b9f4fd9-50d0-4636-a7fc-2fd1634bb57f\",\"domain\":\".apollo.io\",\"path\":\"/\",\"expires\":1732211087,\"size\":63,\"httpOnly\":false,\"secure\":false,\"session\":false,\"sameSite\":\"Lax\",\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"intercom-session-dyws6i9m\",\"value\":\"MWZxNmYydy9oMFVxU1oyOFEwOHZNOEdXNzVEUWZCZ2JaY3BFbDBSZnlaUVMxbFBZcWtBRytSSFl5d3VwNnhuei0tR2dTNVR5WW9lYlU2a2d3LzhKdDBYZz09--ef48a55b8fc4ab8da53b50580b370f5af96e86a9\",\"domain\":\".apollo.io\",\"path\":\"/\",\"expires\":1709485887,\"size\":187,\"httpOnly\":false,\"secure\":false,\"session\":false,\"sameSite\":\"Lax\",\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"remember_token_leadgenie_v2\",\"value\":\"eyJfcmFpbHMiOnsibWVzc2FnZSI6IklqWTFPVEl6WW1Jd1l6WTNaVEF6TURGaFpUVTVaV0l6TjE4ek5qZzVPRGMyTkdJeE16bG1aamM0TURnMU9UaGhaRGxpWkRjeE5ETTBaaUk9IiwiZXhwIjoiMjAyNC0wMy0yNVQxNzoxMToyMy4zMjZaIiwicHVyIjoiY29va2llLnJlbWVtYmVyX3Rva2VuX2xlYWRnZW5pZV92MiJ9fQ%3D%3D--b75bf5c81af6d390e125744e8b7f09cce4d0987b\",\"domain\":\".apollo.io\",\"path\":\"/\",\"expires\":1711386683.604357,\"size\":317,\"httpOnly\":false,\"secure\":true,\"session\":false,\"sameSite\":\"None\",\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"__stripe_sid\",\"value\":\"08055710-c733-494b-8b3e-868bfeffe9a887f9e8\",\"domain\":\".app.apollo.io\",\"path\":\"/\",\"expires\":1708882888,\"size\":54,\"httpOnly\":false,\"secure\":true,\"session\":false,\"sameSite\":\"Strict\",\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"__stripe_mid\",\"value\":\"66dd93e7-2c6c-42b3-b27a-93d5324635e6bceae1\",\"domain\":\".app.apollo.io\",\"path\":\"/\",\"expires\":1740417088,\"size\":54,\"httpOnly\":false,\"secure\":true,\"session\":false,\"sameSite\":\"Strict\",\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"ZP_Pricing_Split_Test_Variant\",\"value\":\"23Q4_EC_Z59\",\"domain\":\".apollo.io\",\"path\":\"/\",\"expires\":-1,\"size\":40,\"httpOnly\":false,\"secure\":true,\"session\":true,\"sameSite\":\"Lax\",\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"GCLB\",\"value\":\"CMyMuMnr_aTHEw\",\"domain\":\"app.apollo.io\",\"path\":\"/\",\"expires\":1708881678.077896,\"size\":18,\"httpOnly\":true,\"secure\":false,\"session\":false,\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443}]",
//      "proxy":null,
//      "lastUsed":"2024-03-09T22:30:46.718Z",
//      "__v":0,
//      "loginType":"default",
//      "domainEmail":"tessa@genzcompany.live",
//      "emailCreditsLimit":10000,
//      "emailCreditsUsed":79,
//      "renewalDateTime":null,
//      "renewalEndDate":1712444400000,
//      "renewalStartDate":1709769600000,
//      "trialDaysLeft":null,
//      "history":[
//         [
//            ,
//             ,
//            "jealous-billowy-jolly-apple",
//            "a937275c-becf-471c-b7bc-4990830d2f29"
//         ],
//         [
//            ,
//            ,
//            "drab-sharp-bored-application",
//            "b678d90b-c275-49ee-beda-1b72634f3346"
//         ]
//      ],
//      "verified":"yes",
//      "apolloPassword":"mannyman17"
//   },
  // { // THIS ACC
  //    "_id":"65c252b6555eda7a89609289",
  //    "domain":"tryrenoblade",
  //    "accountType":"free",
  //    "trialTime":"",
  //    "isSuspended":false,
  //    "loginType":"default",
  //    "domainEmail":"luke@tryrenoblade.live",
  //    "firstname":"",
  //    "lastname":"",
  //    "email":"ivanorr70@gmail.com",
  //    "password":"ygdaldauymereyzx",
  //    "cookie":"[{\"name\":\"_dd_s\",\"value\":\"rum=0&expire=1710020619087\",\"domain\":\"app.apollo.io\",\"path\":\"/\",\"expires\":1710020619,\"size\":31,\"httpOnly\":false,\"secure\":false,\"session\":false,\"sameSite\":\"Strict\",\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"amplitude_id_122a93c7d9753d2fe678deffe8fac4cfapollo.io\",\"value\":\"eyJkZXZpY2VJZCI6IjViMmZjYjMyLTIxOTMtNGE4Zi1iZTY3LTY0YjVkNTQyMWViM1IiLCJ1c2VySWQiOm51bGwsIm9wdE91dCI6ZmFsc2UsInNlc3Npb25JZCI6MTcxMDAxOTYyMTkxOSwibGFzdEV2ZW50VGltZSI6MTcxMDAxOTcxODg2OCwiZXZlbnRJZCI6MiwiaWRlbnRpZnlJZCI6MCwic2VxdWVuY2VOdW1iZXIiOjJ9\",\"domain\":\".apollo.io\",\"path\":\"/\",\"expires\":1744579718.86861,\"size\":298,\"httpOnly\":false,\"secure\":false,\"session\":false,\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"X-CSRF-TOKEN\",\"value\":\"NYpFHjqZIf9cwaZk-kHV4fmX51ZxdxC80oEilM_KrW1Vmacdjl9gt3WLTfa8cPMkUbRiCAJX9IEWglSwflwSFQ\",\"domain\":\"app.apollo.io\",\"path\":\"/\",\"expires\":-1,\"size\":98,\"httpOnly\":false,\"secure\":true,\"session\":true,\"sameSite\":\"Lax\",\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"_leadgenie_session\",\"value\":\"7%2Bb9Z%2BZkH8jz4EtRJzYDwMubG3Y%2FKuFuCYFTpOwlX%2BKgq8dkmGpS%2BjHj7Rb2vTuiL2tzfhizS%2BHT7weWcY6DHtXILLbi8B8xiMb0FQsjSiNBgSBLdG8r0BZFMEuctOSsOXx%2F6JhxHTRpv6kC3zXJyk%2BZjwdOKerpu4QZScRllUtZs6aVcsC7F8gpw1cutRw7KkRAmc406RGgkBru%2BCtPlQzADFDZHozlTfEQTKGOCNnIf8LoXG7s2HRdj4NY%2BpwNBP9mm2YrLpp58vn3IR%2BC0c%2BIthceFxntGio%3D--wcsYToJyFWewi82d--ThmpdaXv5Lx2UP56VIhRPg%3D%3D\",\"domain\":\"app.apollo.io\",\"path\":\"/\",\"expires\":-1,\"size\":384,\"httpOnly\":true,\"secure\":true,\"session\":true,\"sameSite\":\"None\",\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"GCLB\",\"value\":\"CI-c_cmwpdioogE\",\"domain\":\"app.apollo.io\",\"path\":\"/\",\"expires\":1710020219.434311,\"size\":19,\"httpOnly\":true,\"secure\":false,\"session\":false,\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"ZP_Pricing_Split_Test_Variant\",\"value\":\"23Q4_EC_Z59\",\"domain\":\".apollo.io\",\"path\":\"/\",\"expires\":-1,\"size\":40,\"httpOnly\":false,\"secure\":true,\"session\":true,\"sameSite\":\"Lax\",\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443}]",
  //    "proxy":"",
  //    "recoveryEmail":"",
  //    "emailCreditsUsed":-1,
  //    "emailCreditsLimit":-1,
  //    "renewalDateTime":0,
  //    "renewalStartDate":0,
  //    "renewalEndDate":0,
  //    "trialDaysLeft":-1,
  //    "lastUsed":"2024-02-06T15:38:50.000Z",
  //    "__v":0,
  //    "history":[
  //     [
  //        3,
  //        3
  //     ],
  //     [
  //        5,
  //        4
  //     ]
  //  ],
  //    "verified":false
  // },
  // {
  //    "_id":"65c253504dabd605fc9afe8d",
  //    "domain":"tryrenoblade",
  //    "accountType":"free",
  //    "trialTime":"",
  //    "isSuspended":false,
  //    "loginType":"default",
  //    "domainEmail":"john@tryrenoblade.live",
  //    "firstname":"",
  //    "lastname":"",
  //    "email":"ivanorr70@gmail.com",
  //    "password":"ygdaldauymereyzx",
  //    "cookie":"[{\"name\":\"OTZ\",\"value\":\"7442908_56_56_123900_52_436380\",\"domain\":\"accounts.google.com\",\"path\":\"/\",\"expires\":1711470496,\"size\":33,\"httpOnly\":false,\"secure\":true,\"session\":false,\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"NID\",\"value\":\"511=EeXjxKJHnfucPSSWnFHYxDcfmqrX4IOW_kDbUPlDR16gYOqX7yhLd6M6fJ49AQ9TxXUD3z3nIx6fVFyJDEg_950EGCP-_kHBnHeRKX-LTsalbnr29cDDdfV9qWGu6UMvLDwJt1ph2c1KAJdq1s6C-wlw1ghFWI6WcKrUbjtIf5s\",\"domain\":\".google.com\",\"path\":\"/\",\"expires\":1724689693.813711,\"size\":178,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameSite\":\"None\",\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"__Host-GAPS\",\"value\":\"1:hJ3IGeSmh8Sypr82chyKpNMm9vbQ5w:23dg_ZVjTMW_7Uwd\",\"domain\":\"accounts.google.com\",\"path\":\"/\",\"expires\":1743438493.506041,\"size\":60,\"httpOnly\":true,\"secure\":true,\"session\":false,\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443}]",
  //    "proxy":"",
  //    "recoveryEmail":"",
  //    "emailCreditsUsed":-1,
  //    "emailCreditsLimit":-1,
  //    "renewalDateTime":0,
  //    "renewalStartDate":0,
  //    "renewalEndDate":0,
  //    "trialDaysLeft":-1,
  //    "lastUsed":"2024-02-06T15:41:57.000Z",
  //    "__v":0,
  //    "history":[
  //     [
  //        1,
  //        5
  //     ],
  //     [
  //        13,
  //        6
  //     ]
  //  ],
  //    "verified":false
  // },
  // {
  //    "_id":"65c256d9cf3838d02355815a",
  //    "domain":"tryrenoblade",
  //    "accountType":"free",
  //    "trialTime":"",
  //    "isSuspended":false,
  //    "loginType":"default",
  //    "domainEmail":"greg@tryrenoblade.live",
  //    "firstname":"",
  //    "lastname":"",
  //    "email":"ivanorr70@gmail.com",
  //    "password":"ygdaldauymereyzx",
  //    "cookie":"[{\"name\":\"_dd_s\",\"value\":\"rum=0&expire=1710022375581\",\"domain\":\"app.apollo.io\",\"path\":\"/\",\"expires\":1710022376,\"size\":31,\"httpOnly\":false,\"secure\":false,\"session\":false,\"sameSite\":\"Strict\",\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"amplitude_id_122a93c7d9753d2fe678deffe8fac4cfapollo.io\",\"value\":\"eyJkZXZpY2VJZCI6IjQ0YjJkZDFmLThjZWUtNDBjOS1iMjhiLWFkZDY0M2MyNzc2OFIiLCJ1c2VySWQiOm51bGwsIm9wdE91dCI6ZmFsc2UsInNlc3Npb25JZCI6MTcxMDAyMDAyMTg5NSwibGFzdEV2ZW50VGltZSI6MTcxMDAyMTQ3NjYyNCwiZXZlbnRJZCI6NywiaWRlbnRpZnlJZCI6MCwic2VxdWVuY2VOdW1iZXIiOjd9\",\"domain\":\".apollo.io\",\"path\":\"/\",\"expires\":1744581476.624333,\"size\":298,\"httpOnly\":false,\"secure\":false,\"session\":false,\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"X-CSRF-TOKEN\",\"value\":\"ODH0v2XKFXJt5t2ad7QqVyfWjxWvcKYdXO5xgEJd71V3IpwoXeccjVLKs1JvUzlfv6B33IUO3ie5sR17Q9i98w\",\"domain\":\"app.apollo.io\",\"path\":\"/\",\"expires\":-1,\"size\":98,\"httpOnly\":false,\"secure\":true,\"session\":true,\"sameSite\":\"Lax\",\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"_leadgenie_session\",\"value\":\"r96c%2BUwLwVbvUtttt2kwRDTrzWZtf%2FCpWdsYzBaU8U1iUczRUid1wnSMq1g28r%2FsdsossvfcrSwbUmoWT1f07TO2wcrXeh3HA32AHJn2rSH%2BvBi%2BPhn1qwYgSSTnVrgrRdzxq2DvNu%2F%2FKgUcb%2FG1AOz7KDhmaDfP8da46yi3fL5P8HlzyHYLGegt29g1FYsKIFe7yvSj7BJlse1lKo6w%2BUAXdYFj0qIYsMSaChoinAkebOQzqnqST2lBJj%2B5CW8n27mrT9wtwIRyqjzVgpTaRFhTFDyRGjKYnx0%3D--MnyECJ3dL82hpO5L--NH8EX%2B3pkaIlJllzt86WQg%3D%3D\",\"domain\":\"app.apollo.io\",\"path\":\"/\",\"expires\":-1,\"size\":382,\"httpOnly\":true,\"secure\":true,\"session\":true,\"sameSite\":\"None\",\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"GCLB\",\"value\":\"CP2V8aLCkIS4zQE\",\"domain\":\"app.apollo.io\",\"path\":\"/\",\"expires\":1710022073.649994,\"size\":19,\"httpOnly\":true,\"secure\":false,\"session\":false,\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443},{\"name\":\"ZP_Pricing_Split_Test_Variant\",\"value\":\"23Q4_EC_Z59\",\"domain\":\".apollo.io\",\"path\":\"/\",\"expires\":-1,\"size\":40,\"httpOnly\":false,\"secure\":true,\"session\":true,\"sameSite\":\"Lax\",\"sameParty\":false,\"sourceScheme\":\"Secure\",\"sourcePort\":443}]",
  //    "proxy":"",
  //    "recoveryEmail":"",
  //    "emailCreditsUsed":-1,
  //    "emailCreditsLimit":-1,
  //    "renewalDateTime":0,
  //    "renewalStartDate":0,
  //    "renewalEndDate":0,
  //    "trialDaysLeft":-1,
  //    "lastUsed":"2024-02-06T15:57:03.000Z",
  //    "__v":0,
  //    "apolloPassword":"mw9ytlz8VJAOeacH40Qt",
  //    "verified":"no",
  //    "history":[
  //     [
  //        9,
  //        7
  //     ],
  //     [
  //        1,
  //        8
  //     ]
  //  ],
  // },
  // {
  //    "_id":"65c258cb1998465ba5ab8106",
  //    "domain":"tryrenoblade",
  //    "accountType":"free",
  //    "trialTime":"",
  //    "isSuspended":false,
  //    "loginType":"default",
  //    "domainEmail":"paul@tryrenoblade.live",
  //    "firstname":"",
  //    "lastname":"",
  //    "email":"ivanorr70@gmail.com",
  //    "password":"ygdaldauymereyzx",
  //    "cookie":"",
  //    "proxy":"",
  //    "recoveryEmail":"",
  //    "emailCreditsUsed":-1,
  //    "emailCreditsLimit":-1,
  //    "renewalDateTime":0,
  //    "renewalStartDate":0,
  //    "renewalEndDate":0,
  //    "trialDaysLeft":-1,
  //    "lastUsed":"2024-02-06T16:03:19.000Z",
  //    "__v":0,
  //    "history":[
  //     [
  //        1,
  //        9
  //     ],
  //     [
  //        2,
  //        10
  //     ]
  //  ],
  //    "verified":false
  // },
  // {
  //    "_id":"65c261f1f3dd661be9dd170b",
  //    "domain":"tryrenoblade",
  //    "accountType":"free",
  //    "trialTime":"",
  //    "isSuspended":false,
  //    "loginType":"default",
  //    "domainEmail":"femi@tryrenoblade.live",
  //    "firstname":"",
  //    "lastname":"",
  //    "email":"ivanorr70@gmail.com",
  //    "password":"ygdaldauymereyzx",
  //    "cookie":"",
  //    "proxy":"",
  //    "recoveryEmail":"",
  //    "emailCreditsUsed":-1,
  //    "emailCreditsLimit":-1,
  //    "renewalDateTime":0,
  //    "renewalStartDate":0,
  //    "renewalEndDate":0,
  //    "trialDaysLeft":-1,
  //    "lastUsed":"2024-02-06T16:44:10.000Z",
  //    "__v":0,
  //    "history":[
  //     [
  //        1,
  //        11
  //     ],
  //     [
  //        13,
  //        12
  //     ]
  //  ],
  //    "verified":false
  // },
  // {
  //    "_id":"65c26a0cefd553e359e065bd",
  //    "domain":"tryrenoblade",
  //    "accountType":"free",
  //    "trialTime":"",
  //    "isSuspended":false,
  //    "loginType":"default",
  //    "domainEmail":"megan@tryrenoblade.live",
  //    "firstname":"",
  //    "lastname":"",
  //    "email":"ivanorr70@gmail.com",
  //    "password":"ygdaldauymereyzx",
  //    "cookie":"",
  //    "proxy":"",
  //    "recoveryEmail":"",
  //    "emailCreditsUsed":-1,
  //    "emailCreditsLimit":-1,
  //    "renewalDateTime":0,
  //    "renewalStartDate":0,
  //    "renewalEndDate":0,
  //    "trialDaysLeft":-1,
  //    "lastUsed":"2024-02-06T17:18:45.000Z",
  //    "__v":0,
  //    "history":[
  //     [
  //        4,
  //        13
  //     ],
  //     [
  //        2,
  //        14
  //     ]
  //  ],
  //    "verified":false
  // },
  // {
  //    "_id":"65c26b62334be41140059956",
  //    "domain":"tryrenoblade",
  //    "accountType":"free",
  //    "trialTime":"",
  //    "isSuspended":false,
  //    "loginType":"default",
  //    "domainEmail":"lela@tryrenoblade.live",
  //    "firstname":"",
  //    "lastname":"",
  //    "email":"ivanorr70@gmail.com",
  //    "password":"ygdaldauymereyzx",
  //    "cookie":"",
  //    "proxy":"",
  //    "recoveryEmail":"",
  //    "emailCreditsUsed":-1,
  //    "emailCreditsLimit":-1,
  //    "renewalDateTime":0,
  //    "renewalStartDate":0,
  //    "renewalEndDate":0,
  //    "trialDaysLeft":-1,
  //    "lastUsed":"2024-02-06T17:24:29.000Z",
  //    "__v":0,
  //    "history":[
  //     [
  //        5,
  //        15
  //     ],
  //     [
  //        2,
  //        16
  //     ]
  //  ],
  //    "verified":false
  // },
  // {
  //    "_id":"65c26c5b375d4b47a634a415",
  //    "domain":"tryrenoblade",
  //    "accountType":"free",
  //    "trialTime":"",
  //    "isSuspended":false,
  //    "loginType":"default",
  //    "domainEmail":"will@tryrenoblade.live",
  //    "firstname":"",
  //    "lastname":"",
  //    "email":"ivanorr70@gmail.com",
  //    "password":"ygdaldauymereyzx",
  //    "cookie":"",
  //    "proxy":"",
  //    "recoveryEmail":"",
  //    "emailCreditsUsed":-1,
  //    "emailCreditsLimit":-1,
  //    "renewalDateTime":0,
  //    "renewalStartDate":0,
  //    "renewalEndDate":0,
  //    "trialDaysLeft":-1,
  //    "lastUsed":"2024-02-06T17:27:14.000Z",
  //    "__v":0,
  //    "history":[
  //     [
  //        1,
  //        17
  //     ],
  //     [
  //        9,
  //        18
  //     ]
  //  ],
  //    "verified":false
  // },
  // {
  //    "_id":"65c26ce793908ebd44cd82e3",
  //    "domain":"tryrenoblade",
  //    "accountType":"free",
  //    "trialTime":"",
  //    "isSuspended":false,
  //    "loginType":"default",
  //    "domainEmail":"willy@tryrenoblade.live",
  //    "firstname":"",
  //    "lastname":"",
  //    "email":"ivanorr70@gmail.com",
  //    "password":"ygdaldauymereyzx",
  //    "cookie":"",
  //    "proxy":"",
  //    "recoveryEmail":"",
  //    "emailCreditsUsed":-1,
  //    "emailCreditsLimit":-1,
  //    "renewalDateTime":0,
  //    "renewalStartDate":0,
  //    "renewalEndDate":0,
  //    "trialDaysLeft":-1,
  //    "lastUsed":"2024-02-06T17:30:32.000Z",
  //    "__v":0,
  //    "history":[
  //     [
  //       3,
  //       1
  //     ],
  //     [
  //       20,
  //       2
  //     ]
  //  ],
  //    "verified":false
  // }
// ]















// app.post('/scrape', async (req, res) => {
//   console.log('scrape')

//   let metaID: string = req.body.id;
//   let metadata: IMetaData;
//   let useProxy: boolean = req.body.proxy || false;
//   const url = req.body.url;

//   try {
//     // (FIX) test if works
//     if (!url) {
//       throw new Error('failed to start scraper, invalid scrape parameters, please provide a valid start and end page')
//     }
    
//     // if (!metaID) {
//     //   metadata = await initMeta(url)
//     // } else {
//     //   metadata = await MetadataModel.findOne({_id:metaID})
//     //     .then((m) => {
//     //       if (!m) throw new Error('failed to start scraper, could not find metadata')
//     //       return m
//     //     })
//     // }

//     // const account = (await selectAccForScrapingFILO(1, accs))[0]

//     // (FIX) ============ PUT INTO FUNC =====================
//     // leads recover (is account has listName and no date or numOfLeadsScraped)
//     // (FIX) test to see if it works
//     const metasWithEmptyList = met[0].scrapes.filter((l) => {
//       const history = accs[0].history.find(h => {
//         return h[2] === l.listName
//       })
//       if (!history) return false
//       return history[0] === undefined && !history[1]
//     })

//     if (metasWithEmptyList.length) {
//       for (let s of metasWithEmptyList) {
//         console.log(s)
//         // const data = await getSavedListAndScrape('', {} as any, s.listName)
//         // await saveLeadsFromRecovery('', metadata, account, data, s.date, s.scrapeID, s.listName, proxy) // make func for updating db scrape
//       }
//     }
//   // =========================================================



//     res.json({ok: true, message: null, data: null});
//   } catch (err: any) {
//     res.json({ok: false, message: err.message || 'failed to scrape' , data: null});
//   }
// });







