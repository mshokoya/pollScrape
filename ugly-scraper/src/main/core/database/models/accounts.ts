import { Schema, model } from 'mongoose'
import {
  CreateOptions,
  DataTypes,
  DestroyOptions,
  FindOptions,
  Model,
  SaveOptions
} from 'sequelize'
import { sequelize } from '../db'
import { truncate } from 'original-fs'
import { IAccount } from '../../../../shared'

// @ts-ignore
export const Account = sequelize.define('account', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
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
    type: DataTypes.STRING,
    allowNull: true
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
  findAll: async (
    filter: Partial<Omit<IAccount, 'history'>> = {},
    opts?: FindOptions
  ): Promise<IAccount[]> =>
    //@ts-ignore
    (await Account.findAll<IAccount>({ where: filter, raw: true, ...opts })).map((a) => ({
      ...a,
      history: JSON.parse(a.history as any)
    })),
  create: async (a: Partial<IAccount> = {}, opts?: CreateOptions): Promise<IAccount> =>
    //@ts-ignore
    await Account.create({ ...a, history: JSON.stringify(a.history) }, { raw: true, ...opts }).then(
      (a1) => ({
        ...a1.dataValues,
        history: JSON.parse(a1.dataValues.history as any)
      })
    ),
  findById: async (id: string, opts: FindOptions = {}): Promise<IAccount> =>
    //@ts-ignore
    await Account.findByPk<IAccount>(id, { raw: true, ...opts })
      .then((a1) => ({ ...a1, history: JSON.parse(a1.history as any) }))
      .catch(() => null),
  findOne: async (
    filter: Partial<Omit<IAccount, 'history'>> = {} as any,
    opts?: FindOptions
  ): Promise<IAccount> =>
    //@ts-ignore
    await Account.findOne<IAccount>({ raw: true, where: filter, ...opts })
      .then((a1) => ({ ...a1, history: JSON.parse(a1.history as any) }))
      .catch(() => null),
  findOneAndUpdate: async (
    filter: Partial<Omit<IAccount, 'history'>>,
    data: Partial<IAccount>,
    opts?: SaveOptions & FindOptions
  ): Promise<IAccount> => {
    const account: Model = await Account.findOne({ where: filter, ...opts }).catch(() => null)
    if (!account) return null

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || value === null) {
        continue
      } else if (key === 'history') {
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
  },
  findOneAndDelete: async (
    filter: Partial<Omit<IAccount, 'history'>>,
    opts?: DestroyOptions
  ): Promise<number> => {
    // @ts-ignore
    return await Account.destroy({ where: filter, ...opts }).then((n) => (n === 0 ? null : n))
  },
  pushToArray: async (
    filter: Partial<Omit<IAccount, 'history'>>,
    key: 'history',
    value: any[],
    opts?: SaveOptions & FindOptions
  ): Promise<IAccount> => {
    const account: Model = await Account.findOne({ where: filter, ...opts }).catch(() => null)

    if (!account) return null

    const arr = JSON.parse(account[key])

    if (!Array.isArray(arr)) return null

    arr.push(value)
    account[key] = JSON.stringify(arr)

    return await account
      .save(opts)
      // @ts-ignore
      .then((a1) => ({ ...a1.dataValues, history: JSON.parse(a1.dataValues.history) }))
  }
}

const accountSchema = new Schema<IAccount>({
  domain: { type: String, default: '' },
  accountType: { type: String, default: 'free' }, // free or premuim
  trialTime: { type: String, default: '' }, // should be trial end date & time
  suspended: { type: Boolean, default: false },
  loginType: { type: String, default: 'default' }, // (FIX) remove and switch with domain
  verified: { type: String, default: 'no' },
  email: { type: String, default: '' },
  password: { type: String, default: '' },
  cookies: { type: String, default: '' },
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
