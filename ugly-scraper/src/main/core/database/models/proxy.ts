import { Schema, model } from 'mongoose'
import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../db'

export type IProxy = {
  _id: string
  proxy: string
  protocol: string
  host: string
  port: string
}

export const Proxy = sequelize.define('proxy', {
  proxy: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  protocol: {
    type: DataTypes.STRING,
    allowNull: false
  },
  host: {
    type: DataTypes.STRING,
    allowNull: false
  },
  port: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: false
  }
})

export const ProxyModel_ = {
  findAll: async (filter: Partial<IProxy> = {}) =>
    // @ts-ignore
    await Proxy.findAll<IProxy>({ where: filter, raw: true }),
  create: async (p: Partial<IProxy> = {}) =>
    await Proxy.create(p, { raw: true })
      .then((p1) => p1.dataValues)
      .catch(() => null),
  findById: async (id: string) =>
    // @ts-ignore
    await Proxy.findByPk<IProxy>(id, { raw: true }).catch(() => null),
  findOne: async (filter: Partial<IProxy> = {} as any) =>
    // @ts-ignore
    await Proxy.findOne<IProxy>({ raw: true, where: filter }).catch(() => null),
  findOneAndUpdate: async (filter: Partial<IProxy>, data: Partial<IProxy>) => {
    const proxy: Model = await Proxy.findOne({ where: filter }).catch(() => null)

    if (!proxy) return null

    for (const [key, value] of Object.entries(data)) {
      proxy[key] = value
    }

    return await proxy
      .save()
      // @ts-ignore
      .then((p) => p.dataValues)
      .catch(() => null)
  },
  findOneAndDelete: async (filter: Partial<IProxy>) => {
    // @ts-ignore
    return await Proxy.destroy({ where: filter })
      .then((n) => (n === 0 ? null : n))
      .catch(() => null)
  }
}

const proxy = new Schema<IProxy>({
  proxy: { type: String, default: '' },
  protocol: { type: String, default: '' },
  host: { type: String, default: '' },
  port: { type: String, default: '' }
})

export const ProxyModel = model<IProxy>('proxies', proxy)
