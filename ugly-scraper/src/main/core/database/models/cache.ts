import { DataTypes, DestroyOptions, FindOptions, Model, SaveOptions } from 'sequelize'
import { sequelize } from '../db'
import { IProxy } from '../../../../shared'

export const Proxy = sequelize.define('proxy', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
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
  findAll: async (filter: Partial<IProxy> = {}, opts?: FindOptions) =>
    // @ts-ignore
    await Proxy.findAll<IProxy>({ where: filter, raw: true, ...opts }),
  create: async (p: Partial<IProxy> = {}, opts?: SaveOptions) =>
    await Proxy.create(p, { raw: true, ...opts })
      .then((p1) => p1.dataValues)
      .catch(() => null),
  findById: async (id: string, opts?: FindOptions) =>
    // @ts-ignore
    await Proxy.findByPk<IProxy>(id, { raw: true, ...opts }).catch(() => null),
  findOne: async (filter: Partial<IProxy> = {} as any, opts?: FindOptions) =>
    // @ts-ignore
    await Proxy.findOne<IProxy>({ raw: true, where: filter, ...opts }).catch(() => null),
  findOneAndUpdate: async (
    filter: Partial<IProxy>,
    data: Partial<IProxy>,
    opts?: SaveOptions & FindOptions
  ) => {
    const proxy: Model = await Proxy.findOne({ where: filter, ...opts }).catch(() => null)

    if (!proxy) return null

    for (const [key, value] of Object.entries(data)) {
      proxy[key] = value
    }

    return await proxy
      .save(opts)
      // @ts-ignore
      .then((p) => p.dataValues)
      .catch(() => null)
  },
  findOneAndDelete: async (filter: Partial<IProxy>, opts?: DestroyOptions) => {
    // @ts-ignore
    return await Proxy.destroy({ where: filter, ...opts })
      .then((n) => (n === 0 ? null : n))
      .catch(() => null)
  }
}
