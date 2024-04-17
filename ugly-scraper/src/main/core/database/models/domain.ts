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
import { IDomain } from '../../../../shared'

export const Domain = sequelize.define('domain', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
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
  findAll: async (filter: Partial<IDomain> = {}, opts?: FindOptions) =>
    // @ts-ignore
    await Domain.findAll<IDomain>({ where: filter, raw: true, ...opts }),
  create: async (d: Partial<IDomain> = {}, opts?: CreateOptions) =>
    await Domain.create(d, { raw: true, ...opts })
      .then((d1) => d1.dataValues)
      .catch(() => null),
  findById: async (id: string, opts?: FindOptions) =>
    // @ts-ignore
    await Domain.findByPk<IDomain>(id, { raw: true, ...opts }).catch(() => null),
  findOne: async (filter: Partial<IDomain> = {} as any, opts?: FindOptions) =>
    // @ts-ignore
    await Domain.findOne<IDomain>({ raw: true, where: filter, ...opts }).catch(() => null),
  findOneAndUpdate: async (
    filter: Partial<IDomain>,
    data: Partial<IDomain>,
    opts?: SaveOptions & FindOptions
  ) => {
    const domain: Model = await Domain.findOne({ where: filter, ...opts }).catch(() => null)

    if (!domain) return null

    for (const [key, value] of Object.entries(data)) {
      domain[key] = value
    }

    return await domain
      .save(opts)
      // @ts-ignore
      .then((d1) => d1.dataValues)
      .catch(() => null)
  },
  findOneAndDelete: async (filter: Partial<IDomain>, opts?: DestroyOptions) => {
    // @ts-ignore
    return await Domain.destroy({ where: filter, ...opts })
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
