import { Schema, model } from 'mongoose'
import { CreateOptions, DataTypes, DestroyOptions, Model, SaveOptions } from 'sequelize'
import { sequelize } from '../db'

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
    allowNull: true // (FIX) should this be allowed ?
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
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  proxy: {
    type: DataTypes.STRING
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
  cookies: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  history: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]'
  }
})

export const AccountModel_ = {
  findAll: async (filter: Partial<Omit<IAccount, 'history'>> = {}) =>
    //@ts-ignore
    (await Account.findAll<IAccount>({ where: filter, raw: true })).map((a) => ({
      ...a,
      history: JSON.parse(a.history as any)
    })),
  create: async (a: Partial<IAccount> = {}, opts?: CreateOptions) =>
    //@ts-ignore
    await Account.create({ ...a, history: JSON.stringify(a.history) }, { raw: true, ...opts })
      .then((a1) => ({
        ...a1.dataValues,
        history: JSON.parse(a1.dataValues.history as any)
      }))
      .catch(() => null),
  findById: async (id: string) =>
    //@ts-ignore
    await Account.findByPk<IAccount>(id, { raw: true })
      .then((a1) => ({ ...a1, history: JSON.parse(a1.history as any) }))
      .catch(() => null),
  findOne: async (filter: Partial<Omit<IAccount, 'history'>> = {} as any) =>
    //@ts-ignore
    await Account.findOne<IAccount>({ raw: true, where: filter })
      .then((a1) => ({ ...a1, history: JSON.parse(a1.history as any) }))
      .catch(() => null),
  findOneAndUpdate: async (
    filter: Partial<Omit<IAccount, 'history'>>,
    data: Partial<IAccount>,
    opts?: SaveOptions
  ) => {
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

    return await account
      .save(opts)
      // @ts-ignore
      .then((a1) => ({ ...a1.dataValues, history: JSON.parse(a1.dataValues.history) }))
      .catch(() => null)
  },
  findOneAndDelete: async (filter: Partial<Omit<IAccount, 'history'>>, opts?: DestroyOptions) => {
    // @ts-ignore
    return await Account.destroy({ where: filter, ...opts })
      .then((n) => (n === 0 ? null : n))
      .catch(() => null)
  },
  pushToArray: async (
    filter: Partial<Omit<IAccount, 'history'>>,
    key: 'history',
    value: any[],
    opts?: SaveOptions
  ) => {
    const account: Model = await Account.findOne({ where: filter }).catch(() => null)

    if (!account) return null

    const arr = JSON.parse(account[key])

    if (!Array.isArray(arr)) return null

    arr.push(value)
    account[key] = JSON.stringify(arr)

    return await account
      .save(opts)
      // @ts-ignore
      .then((a1) => ({ ...a1.dataValues, history: JSON.parse(a1.dataValues.history) }))
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
  cookies: { type: String, default: '' },
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
