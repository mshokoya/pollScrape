// import { ElectronAPI } from '@electron-toolkit/preload'

type Response<T = any> = Promise<{ ok: boolean; message?: string; data: T }>

declare global {
  interface Window {
    account: {
      accountDemine: (id: string) => Response
      accountUpgradeManually: (id: string) => Response
      accountUpgradeAutomatically: (id: string) => Response
      accountCheck: (id: string) => Response
      accountDelete: (id: string) => Response
      accountLoginAuto: (id: string) => Response
      accountLoginManually: (id: string) => Response
      accountUpdate: (id: string, account: IAccount) => Response<IAccount>
      accountGetAll: () => Response<IAccount[]>
      accountAdd: (
        email: string,
        addType: string,
        selectedDomain: string,
        password: string,
        recoveryEmail: string
      ) => Response
    }
    domain: {
      domainAdd: (domain: string) => Response
      domainVerify: (domain: string) => Response
      domainDelete: (domainID: string) => Response
      domainGetAll: () => Response
    }
    meta: {
      metaGetAll: () => Response
      metaDelete: (id: string) => Response
      metaUpdate: (meta: IMetaData) => Response
    }
    proxy: {
      proxyGetAll: () => Response
      proxyAdd: (url: string, proxy: string) => Response
    }
    record: {
      recordGetAll: () => Response
      recordGet: (id: string) => Response
    }
    scrape: {
      scrape: (id: string, proxy: boolean, url: string) => Response
    }
    ipc: {
      emit: (channel: string, data: Record<string, any>) => void
      on: <T>(channel: string, func: (res: T) => void) => void
    }
  }
}

export type IAccount = {
  id: string
  domain: string
  accountType: 'free' | 'premium'
  trialTime: string
  suspended: boolean
  verified: 'no' | 'confirm' | 'yes' // confirm = conformation email sent
  loginType: 'default' | 'gmail' | 'outlook'
  email: string
  password: string
  cookies: string
  proxy: string
  lastUsed: number // new Date.getTime()
  recoveryEmail: string
  emailCreditsUsed: number
  emailCreditsLimit: number
  renewalDateTime: number | Date
  renewalStartDate: number | Date
  renewalEndDate: number | Date
  trialDaysLeft: number
  history: [
    amountOfLeadsScrapedOnPage: number,
    timeOfScrape: number,
    listName: string,
    scrapeID: string
  ][]
}

export type IMetaData = {
  id: string
  url: string
  params: { [key: string]: string }
  name: string
  scrapes: { scrapeID: string; listName: string; length: number; date: number }[]
  accounts: { accountID: string; range: [min: number, max: number] }[]
}
