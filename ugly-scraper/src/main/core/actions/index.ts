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

// keys are type = ForkActions
export const actions = {
  // account
  a_a_cfma: confirmAccount,
  a_a_um: upgradeManually,
  a_a_ua: upgradeAutomatically,
  a_a_ca: checkAccount,
  a_a_la: loginAuto,
  a_a_aa: addAccount,
  a_a_lm: loginManually,
  a_a_d: demine,
  // domain
  a_d_ad: addDomain,
  a_d_vd: verifyDomain,
  a_d_dd: deleteDomain,
  a_d_gd: getDomains,
  // metadata
  a_m_um: updateMetadata,
  a_m_dm: deleteMetadata,
  a_m_gm: getMetadatas,
  // records
  a_r_grs: getRecords,
  a_r_gr: getRecord,
  // scrape
  a_s_s: scrape,
  // proxy
  a_p_gp: getProxies,
  a_p_ap: addProxy
}
