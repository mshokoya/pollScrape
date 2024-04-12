export { getRecord, getRecords } from './actions/record'
export { addProxy, getProxies } from './actions/proxy'
export {
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
export { deleteMetadata, getMetadatas, updateMetadata } from './actions/metadata'
// import { scrape } from './actions/scrape'
export { addDomain, deleteDomain, getDomains, verifyDomain } from './actions/domain'
