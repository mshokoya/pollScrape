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
import { addDomain, deleteDomain, getDomains, verifyDomain } from './server/domain-route'
import { IAccount } from './database/models/accounts'
import { IMetaData } from './database/models/metadata'

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
export const WaddAccount = async (acc) => await addAccount(acc)

// Domain
export const WaddDomain = async (domain: string) => await addDomain(domain)
export const Wverify = async (domain: string) => await verifyDomain(domain)
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
