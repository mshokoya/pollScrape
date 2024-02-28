import { observable } from "@legendapp/state";
import { ResStatus, ResStatusHelpers, TaskHelpers, TaskInProcess } from "../util";

export const accountState = observable<State>({
  input: {email: '', password: '', recoveryEmail: '', domainEmail: ''},
  selectedAcc: null,
  reqInProcess: {},  // reqInProcess: [],
  reqType: null,
  resStatus: {},
  addType: 'email',
  selectedDomain: null,
})

export const stateHelper = TaskHelpers(accountState.reqInProcess)
export const stateResStatusHelper = ResStatusHelpers(accountState.resStatus)

export type IAccount = {
  _id: string
  domain: string
  accountType: string
  trialTime: string
  suspended: boolean
  verified: boolean
  loginType: 'default' | 'gmail' | 'outlook'
  email: string
  password: string
  cookie: string
  firstname: string
  lastname: string
  proxy: string
  domainEmail: string
  lastUsed: Date
  recoveryEmail: string
  emailCreditsUsed: number
  emailCreditsLimit: number
  renewalDateTime: number | Date
  renewalStartDate: number | Date
  renewalEndDate: number | Date
  trialDaysLeft: number
  apolloPassword: string
}

export type State = {
  input: Partial<IAccount>
  selectedAcc: number | null
  reqInProcess: TaskInProcess<AccountReqType>
  reqType: AccountReqType | null
  resStatus: ResStatus<AccountReqType>,
  addType: 'domain' | 'email'
  selectedDomain: string | null
}

export type AccountReqType = 'confirm' | 'check' | 'login' | 'update' | 'manualLogin'  | 'manualUpgrade' | 'mines' | 'upgrade' | 'delete' | 'new'

