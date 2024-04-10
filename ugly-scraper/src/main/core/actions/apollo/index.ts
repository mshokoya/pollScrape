import { getRecord, getRecords } from './actions/record'
import { addProxy, getProxies } from './actions/proxy'
import {
  TaddAccount,
  TcheckAccount,
  TconfirmAccount,
  TdeleteAccount,
  Tdemine,
  TgetAccounts,
  TloginAuto,
  TloginManually,
  TupdateAcc,
  TupgradeAutomatically,
  TupgradeManually
} from './controllers/account'
import { deleteMetadata, getMetadatas, updateMetadata } from './actions/metadata'
// import { scrape } from './actions/scrape'
import { addDomain, deleteDomain, getDomains, verifyDomain } from './actions/domain'
import { IAccount } from '../../database/models/accounts'
import { IMetaData } from '../../database/models/metadata'

//  free proxies
// https://proxyscrape.com/free-proxy-list
// https://geonode.com/free-proxy-list

// Accounts
export const WconfirmAccount = async (id: string) => await TconfirmAccount(id)
export const WupgradeManually = async (id: string) => await TupgradeManually(id)
export const WupgradeAutomatically = async (id: string) => await TupgradeAutomatically(id)
export const WcheckAccount = async (id: string) => await TcheckAccount(id)
export const WdeleteAccount = async (id: string) => await TdeleteAccount(id)
export const WloginAuto = async (id: string) => await TloginAuto(id)
export const Wdemine = async (id: string) => await Tdemine(id)
export const WloginManually = async (id: string) => await TloginManually(id)
export const WupdateAcc = async (id: string, account: IAccount) => await TupdateAcc(id, account)
export const WgetAccounts = async () => await TgetAccounts()
export const WaddAccount = async (acc) => await TaddAccount(acc)

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
// export const Wscrape = async (id: string, proxy: boolean, url: string) =>
//   await scrape(id, proxy, url)
