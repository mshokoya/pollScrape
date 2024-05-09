import {
  BulkCreateOptions,
  DataTypes,
  DestroyOptions,
  FindOptions,
  Model,
  SaveOptions
} from 'sequelize'
import { sequelize } from '../db'
import { IRecords } from '../../../../shared'

export const Record = sequelize.define('record', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  scrapeID: {
    type: DataTypes.STRING,
    allowNull: false // (FIX) should this be allowed ?
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]'
  }
})

export const RecordModel_ = {
  findAll: async (filter: Partial<Omit<IRecords, 'data'>> = {}, opts?: FindOptions) =>
    //@ts-ignore
    (await Record.findAll<IRecords>({ where: filter, raw: true, ...opts })).map((r) => ({
      ...r,
      data: JSON.parse(r.data as any)
    })),
  create: async (r: Partial<IRecords> = {}, opts?: SaveOptions) =>
    //@ts-ignore
    await Record.create({ ...r, data: JSON.stringify(r.data) }, { raw: true, ...opts }).then(
      (r1) => ({
        ...r1.dataValues,
        data: JSON.parse(r1.dataValues.data as any)
      })
    ),
  findById: async (id: string, opts?: FindOptions) =>
    //@ts-ignore
    await Record.findByPk<IRecords>(id, { raw: true, ...opts })
      .then((r1) => ({ ...r1, data: JSON.parse(r1.data as any) }))
      .catch(() => null),
  findOne: async (filter: Partial<Omit<IRecords, 'data'>> = {} as any, opts?: FindOptions) =>
    //@ts-ignore
    await Record.findOne<IRecords>({ raw: true, where: filter, ...opts })
      .then((r1) => ({ ...r1, data: JSON.parse(r1.data as any) }))
      .catch(() => null),
  findOneAndUpdate: async (
    filter: Partial<Omit<IRecords, 'data'>>,
    data: Partial<IRecords>,
    opts?: SaveOptions & FindOptions
  ) => {
    const record: Model = await Record.findOne({ where: filter, ...opts }).catch(() => null)

    if (!record) return null

    for (const [key, value] of Object.entries(data)) {
      if (key === 'data') {
        // @ts-ignore
        record[key] = JSON.stringify(value)
      } else {
        record[key] = value
      }
    }

    return await record
      .save(opts)
      // @ts-ignore
      .then((r1) => ({ ...r1.dataValues, data: JSON.parse(r1.dataValues.data) }))
  },
  findOneAndDelete: async (filter: Partial<Omit<IRecords, 'data'>>, opts?: DestroyOptions) => {
    // @ts-ignore
    return await Record.destroy({ where: filter, ...opts }).then((n) => (n === 0 ? null : n))
  },
  bulkCreate: async (records: Omit<IRecords, 'id'>[], opts?: BulkCreateOptions) => {
    const r = records.map((r1) => ({ ...r1, data: JSON.stringify(r1.data) }))
    return await Record.bulkCreate(r, opts).then((r) =>
      r.map((r1) => ({ ...r1.dataValues, data: JSON.parse(r1.dataValues.data) }))
    )
  }
}
