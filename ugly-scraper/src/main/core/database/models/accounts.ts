import { Schema, model } from 'mongoose'
import { Model, Q } from '@nozbe/watermelondb'
import { field, json } from '@nozbe/watermelondb/decorators'
import { database } from '../db'

export type IAccount = {
  _id: string
  domain: string
  accountType: 'free' | 'premium'
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

  static async getAll() {
    // @ts-ignore
    return (await database.get<IAccount>('account').query().fetch()).map((a) => {
      // @ts-ignore
      a.history = JSON.parse(a.history)
      return a
    })
  }

  static async findOneById(id: string): Promise<IAccount | null> {
    return await database
      // @ts-ignore
      .get<IAccount>('account')
      .find(id)
      // @ts-ignore
      .then((a: IAccount) => {
        // @ts-ignore
        a.history = JSON.parse(a.history)
        return a
      })
      .catch(() => null)
  }

  static async find(filter: Partial<Omit<IAccount, 'history'>>) {
    const args = Object.entries(filter).map((a: [string, any]) => Q.where(a[0], a[1]))
    return (
      (
        await database
          .get('account')
          .query(...args)
          .fetch()
          .catch(() => [])
      )
        // @ts-ignore
        .map((a: IAccount) => {
          // @ts-ignore
          a.history = JSON.parse(a.history)
          return a
        })
    )
  }

  static async create(account: Partial<IAccount>) {
    return (await database.write(
      async () =>
        //@ts-ignore
        await database.get('account').create((a: IAccount) => {
          a.domain = account.domain || ''
          a.accountType = account.accountType || 'free'
          a.trialTime = account.trialTime || ''
          a.suspended = account.suspended || false
          a.loginType = account.loginType || 'default'
          a.domainEmail = account.domainEmail || ''
          a.verified = account.verified || 'no'
          ;(a.email = account.email || ''), (a.password = account.password || '')
          a.cookie = account.cookie || ''
          a.apolloPassword = account.apolloPassword || ''
          a.proxy = account.password || ''
          a.emailCreditsUsed = account.emailCreditsUsed || -1
          a.emailCreditsLimit = account.emailCreditsLimit || -1
          a.renewalDateTime = account.renewalDateTime || -1
          a.renewalStartDate = account.renewalStartDate || -1
          a.renewalEndDate = account.renewalEndDate || -1
          a.trialDaysLeft = account.trialDaysLeft || -1
          a.lastUsed = account.lastUsed || new Date().getTime()
          // @ts-ignore
          a.history = account.history ? JSON.stringify(account.history) : '[]'
        })
    )) as unknown as IAccount
  }

  static async updateOne(accountID: string, account: Partial<IAccount>) {
    const acc: Model | null = await database
      .get('account')
      .find(accountID)
      .catch(() => null)

    if (!acc) return null

    // @ts-ignore
    return (await acc.update((a: IAccount) => {
      for (const [key, value] of Object.entries(account)) {
        if (key === 'history') {
          // @ts-ignore
          a[key] = JSON.stringify(value)
        } else {
          a[key] = value
        }
      }
    })) as IAccount
  }
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
