import { observable } from '@legendapp/state'
import { ResStatus, ResStatusHelpers, TaskHelpers, TaskInProcess } from '../util'
import { appState$ } from '.'

export const accountState = observable<State>({
  input: { email: '', password: '', recoveryEmail: '', domainEmail: '' },
  selectedAcc: null,
  reqInProcess: {}, // reqInProcess: [],
  reqType: null,
  resStatus: {},
  addType: 'email',
  selectedDomain: null
})

export const accountTaskHelper = TaskHelpers(accountState.reqInProcess)
export const stateResStatusHelper = ResStatusHelpers(accountState.resStatus)

export const selectAccForScrapingFILO = (
  accsNeeded: number
): (IAccount & { totalScrapedInLast30Mins: number })[] => {
  const accs: (IAccount & { totalScrapedInLast30Mins: number })[] = []

  // need to add cache
  const allAccounts = appState$.accounts.get().filter((a) => a.verified === 'yes') as (IAccount & {
    totalScrapedInLast30Mins: number
  })[]

  if (!allAccounts || !allAccounts.length) return []

  if (allAccounts.length === 1) {
    allAccounts[0].totalScrapedInLast30Mins = totalLeadsScrapedInTimeFrame(allAccounts[0])
    return allAccounts
  }

  // get unused accounts first
  for (const a of allAccounts) {
    if (accsNeeded === 0) return accs
    if (!a.history.length) {
      accs.push({ ...a, totalScrapedInLast30Mins: 0 })
      accsNeeded--
    }
  }

  if (accsNeeded === 0) return accs

  // if not enough unused accounts left, get account that have been used least in the last 30mins
  allAccounts.sort((a, b) => {
    const totalLeadsScrapedIn30MinsA = totalLeadsScrapedInTimeFrame(a)
    const totalLeadsScrapedIn30MinsB = totalLeadsScrapedInTimeFrame(b)
    a['totalScrapedInLast30Mins'] = totalLeadsScrapedIn30MinsA
    b['totalScrapedInLast30Mins'] = totalLeadsScrapedIn30MinsB
    return totalLeadsScrapedIn30MinsB - totalLeadsScrapedIn30MinsA
  })

  const accounts = accs.concat(allAccounts.splice(-accsNeeded))
  // const accountIDs = accounts.map(a => a.id)

  // cache.addAccounts(metaID, accountIDs)

  return accounts
}

const totalLeadsScrapedInTimeFrame = (a: IAccount) => {
  const timeLimit = 1000 * 60 * 30 // 30mins
  return a.history.reduce(
    (
      acc: number,
      cv: [
        amountOfLeadsScrapedOnPage: number,
        timeOfScrape: number,
        listName: string,
        scrapeID: string
      ]
    ) => {
      const isWithin30minMark = new Date().getTime() - cv[1] >= timeLimit

      return isWithin30minMark ? acc + (cv[0] as any) : acc
    },
    0
  )
}

export type IAccount = {
  id: string
  domain: string
  accountType: string
  trialTime: string
  suspended: boolean
  verified: 'no' | 'confirm' | 'yes' // confirm = conformation email sent
  loginType: 'default' | 'gmail' | 'outlook'
  email: string
  password: string
  cookies: string
  firstname: string
  lastname: string
  proxy: string
  domainEmail: string
  lastUsed: number // new Date.getTime()
  recoveryEmail: string
  emailCreditsUsed: number
  emailCreditsLimit: number
  renewalDateTime: number | Date
  renewalStartDate: number | Date
  renewalEndDate: number | Date
  trialDaysLeft: number
  apolloPassword: string
  history: [
    amountOfLeadsScrapedOnPage: number,
    timeOfScrape: number,
    listName: string,
    scrapeID: string
  ][]
}

export type State = {
  input: Partial<IAccount>
  selectedAcc: number | null
  reqInProcess: TaskInProcess<AccountReqType>
  reqType: AccountReqType | null
  resStatus: ResStatus<AccountReqType>
  addType: 'domain' | 'email'
  selectedDomain: string | null
}

export type AccountReqType =
  | 'confirm'
  | 'check'
  | 'login'
  | 'update'
  | 'manualLogin'
  | 'manualUpgrade'
  | 'mines'
  | 'upgrade'
  | 'delete'
  | 'new'
