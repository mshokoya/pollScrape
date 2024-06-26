import { DataTypes, DestroyOptions, FindOptions, Model, SaveOptions } from 'sequelize'
import { sequelize } from '../db'
import { IMetaData } from '../../../../shared'

export const MetaData = sequelize.define('metadata', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  params: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '{}'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  scrapes: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]'
  },
  accounts: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]'
  }
})

export const MetaDataModel_ = {
  findAll: async (
    filter: Partial<Omit<IMetaData, 'params' | 'scrapes' | 'accounts'>> = {},
    opts?: FindOptions
  ): Promise<IMetaData[]> =>
    //@ts-ignore
    (await MetaData.findAll<IMetaData>({ where: filter, raw: true, ...opts })).map((m) => ({
      ...m,
      params: JSON.parse(m.params as any),
      scrapes: JSON.parse(m.scrapes as any),
      accounts: JSON.parse(m.accounts as any)
    })),
  create: async (m: Partial<IMetaData> = {}, opts?: SaveOptions): Promise<IMetaData> =>
    //@ts-ignore
    await MetaData.create(
      {
        ...m,
        params: JSON.stringify(m.params as any),
        scrapes: JSON.stringify(m.scrapes as any),
        accounts: JSON.stringify(m.accounts as any)
      },
      { raw: true, ...opts }
    ).then((m) => ({
      ...m.dataValues,
      params: JSON.parse(m.dataValues.params as any),
      scrapes: JSON.parse(m.dataValues.scrapes as any),
      accounts: JSON.parse(m.dataValues.accounts as any)
    })),
  findById: async (id: string, opts?: FindOptions): Promise<IMetaData> =>
    //@ts-ignore
    await MetaData.findByPk<IMetaData>(id, { raw: true, ...opts })
      .then((m) => ({
        ...m,
        params: JSON.parse(m.params as any),
        scrapes: JSON.parse(m.scrapes as any),
        accounts: JSON.parse(m.accounts as any)
      }))
      .catch(() => null),
  findOne: async (
    filter: Partial<Omit<IMetaData, 'params' | 'scrapes' | 'accounts'>> = {} as any,
    opts?: FindOptions
  ): Promise<IMetaData> =>
    //@ts-ignore
    await MetaData.findOne<IMetaData>({ raw: true, where: filter, ...opts })
      .then((m) => ({
        ...m,
        params: JSON.parse(m.params as any),
        scrapes: JSON.parse(m.scrapes as any),
        accounts: JSON.parse(m.accounts as any)
      }))
      .catch(() => null),
  findOneAndUpdate: async (
    filter: Partial<Omit<IMetaData, 'params' | 'scrapes' | 'accounts'>>,
    data: Partial<IMetaData>,
    opts?: SaveOptions & FindOptions
  ): Promise<IMetaData> => {
    const meta: Model = await MetaData.findOne({ where: filter, ...opts }).catch(() => null)

    if (!meta) return null

    for (const [key, value] of Object.entries(data)) {
      if (key === 'params' || key === 'scrapes' || key === 'accounts') {
        // @ts-ignore
        meta[key] = JSON.stringify(value)
      } else {
        meta[key] = value
      }
    }

    return await meta
      .save(opts)
      // @ts-ignore
      .then((m) => ({
        ...m.dataValues,
        params: JSON.parse(m.dataValues.params as any),
        scrapes: JSON.parse(m.dataValues.scrapes as any),
        accounts: JSON.parse(m.dataValues.accounts as any)
      }))
  },
  findOneAndDelete: async (
    filter: Partial<Omit<IMetaData, 'params' | 'scrapes' | 'accounts'>>,
    opts?: DestroyOptions
  ): Promise<number> => {
    // @ts-ignore
    return await MetaData.destroy({ where: filter, ...opts }).then((n) => (n === 0 ? null : n))
  },
  pushToArray: async (
    filter: Partial<Omit<IMetaData, 'scrapes' | 'accounts'>>,
    key: 'scrapes' | 'accounts',
    value: any,
    opts?: SaveOptions & FindOptions
  ): Promise<IMetaData> => {
    const metadata: Model = await MetaData.findOne({ where: filter, ...opts }).catch(() => null)

    // (FIX) throw better error
    if (!metadata) throw new Error('no md')

    const meta = JSON.parse(metadata[key])

    if (!Array.isArray(meta)) throw new Error('no arr')

    meta.push(value)
    metadata[key] = JSON.stringify(meta)

    return await metadata
      .save(opts)
      // @ts-ignore
      .then((m) => ({
        ...m.dataValues,
        params: JSON.parse(m.dataValues.params as any),
        scrapes: JSON.parse(m.dataValues.scrapes as any),
        accounts: JSON.parse(m.dataValues.accounts as any)
      }))
  },
  addToObj: async (
    filter: Partial<Omit<IMetaData, 'params' | 'scrapes' | 'accounts'>>,
    key: 'params',
    value: Record<string, any>,
    opts?: SaveOptions & FindOptions
  ): Promise<IMetaData> => {
    const metadata: Model = await MetaData.findOne({ where: filter, ...opts }).catch(() => null)

    if (!metadata) return null

    const meta = JSON.parse(metadata[key])

    if (!meta && meta.constructor.name !== 'Object') return null

    for (const [k, v] of Object.entries(value)) {
      meta[k] = v
    }

    metadata[key] = JSON.stringify(meta)

    return await metadata.save(opts).then((m1) => ({
      ...m1.dataValues,
      params: JSON.parse(m1.dataValues.params as any),
      scrapes: JSON.parse(m1.dataValues.scrapes as any),
      accounts: JSON.parse(m1.dataValues.accounts as any)
    }))
  }
}
