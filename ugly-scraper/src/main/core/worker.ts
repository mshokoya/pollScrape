import { getRecord, getRecords } from './server/record-routes'
import { addProxy, getProxies } from './server/proxy-routes'
import {
  addAccount,
  checkAccount,
  confirmAccount,
  deleteAccount,
  demine,
  getAccounts,
  loginAuto,
  loginManually,
  updateAcc,
  upgradeAutomatically,
  upgradeManually
} from './server/account-routes'
import { deleteMetadata, getMetadatas, updateMetadata } from './server/metadata-route'
import { scrapeLeads } from './server/scrape-routes'
import { addDomain, deleteDomain, getDomains } from './server/domain-route'
import { AccountModel_, IAccount } from './database/models/accounts'
import { IMetaData, MetaDataModel_ } from './database/models/metadata'
import { RecordModel_ } from './database/models/records'

//  free proxies
// https://proxyscrape.com/free-proxy-list
// https://geonode.com/free-proxy-list

// Accounts
export const WconfirmAccount = async (id: string) => await confirmAccount(id)
export const WupgradeManually = async (id: string) => await upgradeManually(id)
export const WupgradeAutomatically = async (id: string) => await upgradeAutomatically(id)
export const WcheckAccount = async (id: string) => await checkAccount(id)
export const WdeleteAccount = async (id: string) => await deleteAccount(id)
export const WloginAuto = async (id: string) => await loginAuto(id)
export const Wdemine = async (id: string) => await demine(id)
export const WloginManually = async (id: string) => await loginManually(id)
export const WupdateAcc = async (id: string, account: IAccount) => await updateAcc(id, account)
export const WgetAccounts = async () => await getAccounts()
export const WaddAccount = async (
  email,
  addType,
  selectedDomain,
  password,
  recoveryEmail,
  domainEmail
) =>
  await addAccount({
    emaill: email,
    addTypee: addType,
    selectedDomainn: selectedDomain,
    passwordd: password,
    recoveryEmaill: recoveryEmail,
    domainEmaill: domainEmail
  })

// Domain
export const WaddDomain = async (domain: string) => await addDomain(domain)
export const Wverify = async (domain: string) => await confirmAccount(domain)
export const WdeleteDomain = async (id: string) => await deleteDomain(id)
export const WgetDomains = async () => await getDomains()

// metaData
export const WgetMetadatas = async () => await getMetadatas()
export const WdeleteMetadata = async (id: string) => await deleteMetadata(id)
export const WupdateMetadata = async (meta: IMetaData) => await updateMetadata(meta)

// proxy
export const WgetProxies = async () => await getProxies()
export const WaddProxy = async (url: string, proxy: string) => await addProxy(url, proxy)

// record
export const WgetRecord = async (id: string) => await getRecord(id)
export const WgetRecords = async () => await getRecords()

// scrape
export const Wscrape = async (id: string, proxy: boolean, url: string) =>
  await scrapeLeads(id, proxy, url)

// =============

// export const accountCreate = async () =>
//   await RecordModel_.create({
//     url: 'testaEmal@email.com',
//     scrapeID: 'myName'
//   })

// export const accountGetAll = async () => await RecordModel_.findAll()

// export const accountFindOne = async () => await RecordModel_.findOne({ url: 'testaEmal@email.com' })

// export const accountFindById = async () => await RecordModel_.findById(1)

// export const accountFindOneAndUpdate = async () =>
//   await RecordModel_.bulkCreate([
//     { scrapeID: 'new1', url: 'ul42', data: { Name: 'mike', 'Company Name': 'nazzz' } },
//     { scrapeID: 'new2', url: 'ulew3', data: { Name: 'mike', 'Company Name': 'nazzz' } },
//     { scrapeID: 'new3', url: 'ul3eqwdsw', data: { Name: 'mike', 'Company Name': 'nazzz' } },
//     { scrapeID: 'new4', url: 'u32ewqqe', data: { Name: 'mike', 'Company Name': 'nazzz' } },
//     { scrapeID: 'new5', url: 'u32ew23', data: { Name: 'mike', 'Company Name': 'nazzz' } }
//   ])

// export const accountFindOneAndDelete = async () =>
//   await RecordModel_.findOneAndDelete({ url: 'testaEmal@email.com' })



// =========================


// require('ts-node').register()
// import { getRecord, getRecords } from './server/record-routes'
// import { addProxy, getProxies } from './server/proxy-routes'
// import {
//   addAccount,
//   checkAccount,
//   confirmAccount,
//   deleteAccount,
//   demine,
//   getAccounts,
//   loginAuto,
//   loginManually,
//   updateAcc,
//   upgradeAutomatically,
//   upgradeManually
// } from './server/account-routes'
// import { deleteMetadata, getMetadatas, updateMetadata } from './server/metadata-route'
// import { scrapeLeads } from './server/scrape-routes'
// import { addDomain, deleteDomain, getDomains } from './server/domain-route'
// import { IAccount } from './database/models/accounts'
// import { IMetaData } from './database/models/metadata'
// import { RecordModel_ } from './database/models/metadata'

// //  free proxies
// // https://proxyscrape.com/free-proxy-list
// // https://geonode.com/free-proxy-list

// // Accounts
// export const WconfirmAccount = async (id: string) => await confirmAccount(id)
// export const WupgradeManually = async (id: string) => await upgradeManually(id)
// export const WupgradeAutomatically = async (id: string) => await upgradeAutomatically(id)
// export const WcheckAccount = async (id: string) => await checkAccount(id)
// export const WdeleteAccount = async (id: string) => await deleteAccount(id)
// export const WloginAuto = async (id: string) => await loginAuto(id)
// export const Wdemine = async (id: string) => await demine(id)
// export const WloginManually = async (id: string) => await loginManually(id)
// export const WupdateAcc = async (id: string, account: IAccount) => await updateAcc(id, account)
// export const WgetAccounts = async () => await getAccounts()
// export const WaddAccount = async (
//   email,
//   addType,
//   selectedDomain,
//   password,
//   recoveryEmail,
//   domainEmail
// ) =>
//   await addAccount({
//     emaill: email,
//     addTypee: addType,
//     selectedDomainn: selectedDomain,
//     passwordd: password,
//     recoveryEmaill: recoveryEmail,
//     domainEmaill: domainEmail
//   })

// // Domain
// export const WaddDomain = async (domain: string) => await addDomain(domain)
// export const Wverify = async (domain: string) => await confirmAccount(domain)
// export const WdeleteDomain = async (id: string) => await deleteDomain(id)
// export const WgetDomains = async () => await getDomains()

// // metaData
// export const WgetMetadatas = async () => await getMetadatas()
// export const WdeleteMetadata = async (id: string) => await deleteMetadata(id)
// export const WupdateMetadata = async (meta: IMetaData) => await updateMetadata(meta)

// // proxy
// export const WgetProxies = async () => await getProxies()
// export const WaddProxy = async (url: string, proxy: string) => await addProxy(url, proxy)

// // record
// export const WgetRecord = async (id: string) => await getRecord(id)
// export const WgetRecords = async () => await getRecords()

// // scrape
// export const Wscrape = async (id: string, proxy: boolean, url: string) =>
//   await scrapeLeads(id, proxy, url)

// // =============

export const accountCreate = async () =>
  await MetaDataModel_.create({
    url: 'www.apollo.io',
    params: { hello: 'world', this: 'is', me: 'lol' },
    name: 'this-is-the-lool',
    scrapes: [{ scrapeID: 'me=dskjfaw=easd', listName: 'lfjdsa' }],
    accounts: [{ accountID: 'kdjlsaasd', range: [1, 40] }]
  })

export const accountGetAll = async () => await MetaDataModel_.findAll()

export const accountFindOne = async () => await MetaDataModel_.findOne({ url: 'www.apollo.io' })

export const accountFindById = async () => await MetaDataModel_.findById(1)

export const accountFindOneAndUpdate = async () =>
  await MetaDataModel_.findOneAndUpdate({ name: 'this-is-the-lool' }, { url: 'google.com' })

export const accountFindOneAndDelete = async () =>
  await MetaDataModel_.findOneAndDelete({ name: 'this-is-the-lool' })
