import { Schema, model } from 'mongoose'
import { Model } from '@nozbe/watermelondb'
import { field } from '@nozbe/watermelondb/decorators'
import { database } from '../db'

export type IDomain = {
  _id: string
  domain: string
  authEmail: string
  authPassword: string
  verified: boolean
  MXRecords: boolean
  TXTRecords: boolean
  VerifyMessage: string
}

export default class Domain extends Model {
  static table = 'domain'

  @field('domain') domain
  @field('authEmail') authEmail
  @field('authPassword') authPassword
  @field('verified') verified
  @field('MXRecords') MXRecords
  @field('TXTRecords') TXTRecords
  @field('VerifyMessage') VerifyMessage

  static async getAll() {
    return await database.get('domain').query().fetch()
  }

  static async findOneById(id: string): Promise<IAccount | null> {
    return await database
      // @ts-ignore
      .get<IAccount>('account')
      .find(id)
      .catch(() => null)
  }

  static async find(filter: Partial<Omit<IAccount, 'history'>>) {
    const args = Object.entries(filter).map((a: [string, any]) => Q.where(a[0], a[1]))
    return await database
      .get('account')
      .query(...args)
      .fetch()
      .catch(() => [])
  }

  @writer async create(account: Partial<IAccount>) {
    // @ts-ignore
    const newAcc = (await database.get('account').create((a: IAccount) => {
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
      a.history = '[]'
    })) as IAccount

    return newAcc
  }

  async updateOne(accountID: string, account: Partial<IAccount>) {
    const acc: Model | null = await database
      .get('account')
      .find(accountID)
      .catch(() => null)
    if (!acc) return null

    // @ts-ignore
    const newAcc = (await acc.update((a: IAccount) => {
      for (const [key, value] of Object.entries(account)) {
        if (key === 'history') {
          // @ts-ignore
          a.history = JSON.stringify(value)
        }
        a[key] = value
      }
    })) as IAccount

    return newAcc
  }
}

const domainSchema = new Schema<IDomain>({
  domain: { type: String, default: '' },
  // @ts-ignore
  authEmail: { type: String, default: import.meta.env.MAIN_VITE_AUTHEMAIL },
  // @ts-ignore
  authPassword: { type: String, default: import.meta.env.MAIN_VITE_AUTHPASS },
  verified: { type: Boolean, default: false },
  MXRecords: { type: Boolean, default: false },
  TXTRecords: { type: Boolean, default: false },
  VerifyMessage: { type: String, default: '' }
})

export const DomainModel = model<IDomain>('domain', domainSchema)
