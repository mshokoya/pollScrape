// values are type = ForkActions too
export const CHANNELS = {
  // accounts
  a_accountDemine: 'a_ad',
  a_accountUpgradeManually: 'a_aum',
  a_accountUpgradeAutomatically: 'a_aua',
  a_accountCheck: 'a_ac',
  a_accountDelete: 'a_adel', // (FIX) * need to make actions
  a_accountLoginAuto: 'a_ala',
  a_accountLoginManually: 'a_alm',
  a_accountUpdate: 'a_au', // (FIX) * need to make actions
  a_accountGetAll: 'a_aga', // (FIX) * need to make actions
  a_accountAdd: 'a_aa',
  a_accountConfirm: 'a_aca',
  // domain
  a_domainAdd: 'a_da',
  a_domainVerify: 'a_dv',
  a_domainDelete: 'a_dd',
  a_domainGetAll: 'a_dga',
  // metadata
  a_metadataGetAll: 'a_mga',
  a_metadataDelete: 'a_md',
  a_metadataUpdate: 'a_mu',
  // proxy
  a_proxyGetAll: 'a_pga',
  a_proxyAdd: 'a_pa',
  // records
  a_recordsGetAll: 'a_rga',
  a_recordGet: 'a_rg',
  //scrape
  a_scrape: 'a_s'
}

export const QUEUE_CHANNELS = {
  scrapeProcessQueue: 'sqp',
  scrapeQueue: 'sq',
  taskQueue: 'tq',
  taskProcessQueue: 'tpq'
}
