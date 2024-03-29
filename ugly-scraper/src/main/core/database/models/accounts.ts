import { Schema, model } from 'mongoose'
import { Model } from '@nozbe/watermelondb'
import { field, json } from '@nozbe/watermelondb/decorators'

export type IAccount = {
  _id: string
  domain: string
  accountType: string
  trialTime: string
  suspended: boolean
  verified: 'no' | 'confirm' | 'yes' // confirm = conformation email sent
  loginType: 'default' | 'gmail' | 'outlook'
  email: string
  password: string
  cookie: string
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

export default class Account extends Model {
  static table = 'account'

  @field('domain') domain
  @field('accountType') accountType
  @field('trialTime') trialTime
  @field('suspended') suspended
  @field('loginType') loginType
  @field('verified') verified
  @field('email') email
  @field('password') password
  @field('proxy') proxy
  @field('emailCreditsUsed') emailCreditsUsed
  @field('emailCreditsLimit') emailCreditsLimit
  @field('renewalDateTime') renewalDateTime
  @field('renewalStartDate') renewalStartDate
  @field('renewalEndDate') renewalEndDate
  @field('trialDaysLeft') trialDaysLeft
  @field('lastUsed') lastUsed
  @json('history', (f) => f) history
}

const accountSchema = new Schema<IAccount>({
  domain: { type: String, default: '' },
  accountType: { type: String, default: 'free' }, // free or premuim
  trialTime: { type: String, default: '' }, // should be trial end date & time
  suspended: { type: Boolean, default: false },
  loginType: { type: String, default: 'default' }, // (FIX) remove and switch with domain
  domainEmail: { type: String, default: '' },
  verified: { type: String, default: 'no' },
  email: { type: String, default: '' },
  password: { type: String, default: '' },
  cookie: { type: String, default: '' },
  apolloPassword: { type: String, default: '' },
  proxy: { type: String, default: '' },
  emailCreditsUsed: { type: Number, default: -1 },
  emailCreditsLimit: { type: Number, default: -1 },
  renewalDateTime: { type: Number, default: -1 }, // as Date
  renewalStartDate: { type: Number, default: -1 }, // as Date
  renewalEndDate: { type: Number, default: -1 }, // as Date
  trialDaysLeft: { type: Number, default: -1 },
  // @ts-ignore
  lastUsed: { type: Date, default: new Date().getTime() }, // used to pick which to use to scrape
  // @ts-ignore
  history: { type: [Schema.Types.Mixed], default: [] }
})

export const AccountModel = model<IAccount>('accounts', accountSchema)
