import { Schema, model } from 'mongoose'
import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../db'

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

export const Domain = sequelize.define('domain', {
  domain: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  authEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  authPassword: {
    type: DataTypes.STRING,
    allowNull: false
  },
  verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  MXRecords: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  TXTRecords: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  VerifyMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  }
})

export const DomainModel_ = {
  findAll: async (filter: Partial<IDomain> = {}) =>
    // @ts-ignore
    await Domain.findAll<IDomain>({ where: filter, raw: true }),
  create: async (d: Partial<IDomain> = {}) =>
    await Domain.create(d, { raw: true })
      .then((d1) => d1.dataValues)
      .catch(() => null),
  findById: async (id: string) =>
    // @ts-ignore
    await Domain.findByPk<IDomain>(id, { raw: true }).catch(() => null),
  findOne: async (filter: Partial<IDomain> = {} as any) =>
    // @ts-ignore
    await Domain.findOne<IDomain>({ raw: true, where: filter }).catch(() => null),
  findOneAndUpdate: async (filter: Partial<IDomain>, data: Partial<IDomain>) => {
    const domain: Model = await Domain.findOne({ where: filter }).catch(() => null)

    if (!domain) return null

    for (const [key, value] of Object.entries(data)) {
      domain[key] = value
    }

    return await domain
      .save()
      // @ts-ignore
      .then((d1) => d1.dataValues)
      .catch(() => null)
  },
  findOneAndDelete: async (filter: Partial<IDomain>) => {
    // @ts-ignore
    return await Domain.destroy({ where: filter })
      .then((n) => (n === 0 ? null : n))
      .catch(() => null)
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
