import { Schema, model } from 'mongoose'
import { field, json } from '@nozbe/watermelondb/decorators'
import { DataTypes, FindOptions, Model, ModelDefined } from 'sequelize'
import { sequelize } from '../db'

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

// @ts-ignore
export const Account = sequelize.define('account', {
  domain: {
    type: DataTypes.STRING,
    allowNull: true
  },
  accountType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'free'
  },
  trialTime: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  suspended: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  loginType: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: 'default'
  },
  verified: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'no'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  proxy: {
    type: DataTypes.STRING,
    allowNull: false
  },
  emailCreditsUsed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: -1
  },
  emailCreditsLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: -1
  },
  renewalDateTime: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1
  },
  renewalStartDate: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1
  },
  renewalEndDate: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1
  },
  trialDaysLeft: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1
  },
  lastUsed: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: -1
  },
  history: {
    type: DataTypes.ARRAY(DataTypes.JSON),
    allowNull: false,
    defaultValue: []
  }
})

type MD = ModelDefined<IAccount, unknown>

export const AccountModel_ = {
  findAll: async (filter: Partial<Omit<IAccount, 'history'>> = {}) =>
    //@ts-ignore
    (await Account.findAll<IAccount>({ where: filter, raw: true })).map((a) => {
      a.history = JSON.parse(a.history as any)
      return a
    }),
  create: async (account: IAccount) =>
    //@ts-ignore
    await Account.create<IAccount>(account, { raw: true })
      .then((a) => {
        a.history = JSON.parse(a.history as any)
        return a
      })
      .catch(() => null),
  findById: async (id: string) =>
    //@ts-ignore
    await Account.findByPk<IAccount>(id, { raw: true })
      .then((a) => {
        a.history = JSON.parse(a.history as any)
        return a
      })
      .catch(() => null),
  findOne: async (filter: Partial<Omit<IAccount, 'history'>> = {} as any) =>
    //@ts-ignore
    await Account.findOne<IAccount>({ raw: true, where: filter })
      .then((a) => {
        a.history = JSON.parse(a.history as any)
        return a
      })
      .catch(() => null),
  findOneAndUpdate: async (filter: Partial<Omit<IAccount, 'history'>>, data: Partial<IAccount>) => {
    const account: Model = await Account.findOne({ where: filter }).catch(() => null)

    if (!account) return null

    for (const [key, value] of Object.entries(data)) {
      if (key === 'history') {
        // @ts-ignore
        account[key] = JSON.stringify(value)
      } else {
        account[key] = value
      }
    }
    // @ts-ignore
    return await account.save().then((a: IAccount) => {
      a.history = JSON.parse(a.history as any)
      return a
    })
  },
  findOneAndDelete: async (filter: Partial<Omit<IAccount, 'history'>>) => {
    const account: Model = await Account.findOne({ where: filter }).catch(() => null)

    if (!account) return null

    // @ts-ignore
    return await account
      .destroy()
      .then(() => true)
      .catch(() => null)
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
