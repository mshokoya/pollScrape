import {
  confirmAccount,
  upgradeManually,
  upgradeAutomatically,
  checkAccount,
  loginAuto,
  addAccount,
  loginManually,
  demine,
  addDomain,
  verifyDomain,
  deleteDomain,
  getDomains,
  updateMetadata,
  deleteMetadata,
  getMetadatas,
  getRecords,
  getRecord,
  scrape,
  getProxies,
  addProxy
} from './apollo/actions'

// Accounts
export {
  TconfirmAccount,
  TupgradeManually,
  TupgradeAutomatically,
  TcheckAccount,
  TdeleteAccount,
  TloginAuto,
  TaddAccount,
  TgetAccounts,
  TupdateAcc,
  TloginManually,
  Tdemine
} from './apollo/controllers/account'

export {
  addDomain,
  verifyDomain,
  deleteDomain,
  getDomains,
  updateMetadata,
  deleteMetadata,
  getMetadatas,
  getRecords,
  getRecord,
  scrape,
  getProxies,
  addProxy
}

// keys are type = ForkActions
export const actions = {
  // account
  a_aca: confirmAccount,
  a_aum: upgradeManually,
  a_aua: upgradeAutomatically,
  a_ac: checkAccount,
  a_ala: loginAuto,
  a_aa: addAccount,
  a_alm: loginManually,
  a_ad: demine,
  // domain
  a_da: addDomain,
  a_dv: verifyDomain,
  a_dd: deleteDomain,
  a_dga: getDomains,
  // metadata
  a_mu: updateMetadata,
  a_md: deleteMetadata,
  a_mga: getMetadatas,
  // records
  a_rga: getRecords,
  a_rg: getRecord,
  // scrape
  a_s: scrape,
  // proxy
  a_pga: getProxies,
  a_pa: addProxy
}
