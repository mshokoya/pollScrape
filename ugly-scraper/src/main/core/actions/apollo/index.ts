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
export const WconfirmAccount = async ({ accountID, pid }: { accountID: string; pid: string }) =>
  await TconfirmAccount({ accountID, pid })
export const WupgradeManually = async ({ accountID, pid }: { accountID: string; pid: string }) =>
  await TupgradeManually({ accountID, pid })
export const WupgradeAutomatically = async ({
  accountID,
  pid
}: {
  accountID: string
  pid: string
}) => await TupgradeAutomatically({ accountID, pid })
export const WcheckAccount = async ({ accountID, pid }: { accountID: string; pid: string }) =>
  await TcheckAccount({ accountID, pid })
export const WdeleteAccount = async (accountID: string) => await TdeleteAccount(accountID)
export const WloginAuto = async ({ accountID, pid }: { accountID: string; pid: string }) =>
  await TloginAuto({ accountID, pid })
export const Wdemine = async ({ accountID, pid }: { accountID: string; pid: string }) =>
  await Tdemine({ accountID, pid })
export const WloginManually = async ({ accountID, pid }: { accountID: string; pid: string }) =>
  await TloginManually({ accountID, pid })
export const WupdateAcc = async ({ accountID, fields }: { accountID: string; fields: IAccount }) =>
  await TupdateAcc({ accountID, fields })
export const WgetAccounts = async () => await TgetAccounts()
// @ts-ignore
export const WaddAccount = async (acc: IAccount, pid: string) => await TaddAccount({ ...acc, pid })

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
