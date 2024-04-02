import { Schema, model } from 'mongoose'
import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../db'

export type IRecords = {
  _id: string
  scrapeID: string
  url: string
  data: IRecord
}

export type IRecord = {
  Name: string
  Firstname: string
  Lastname: string
  Linkedin: string
  Title: string
  'Company Name': string
  'Company Website': string
  'Comapny Linkedin': string
  'Company Twitter': string
  'Company Facebook': string
  Email: string
  isVerified: boolean
  'Company Location': string
  Employees: string
  Phone: string
  Industry: string
  Keywords: string[]
}

// @ts-ignore
export const Record = sequelize.define('record', {
  scrapeID: {
    type: DataTypes.STRING,
    allowNull: false // (FIX) should this be allowed ?
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  data: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]'
  }
})

export const RecordModel_ = {
  findAll: async (filter: Partial<Omit<IRecords, 'data'>> = {}) =>
    //@ts-ignore
    (await Record.findAll<IRecords>({ where: filter, raw: true })).map((r) => ({
      ...r,
      data: JSON.parse(r.data as any)
    })),
  create: async (r: Partial<IRecords> = {}) =>
    //@ts-ignore
    await Record.create({ ...r, data: JSON.stringify(r.data) }, { raw: true })
      .then((r1) => ({
        ...r1.dataValues,
        data: JSON.parse(r1.dataValues.data as any)
      }))
      .catch(() => null),
  findById: async (id: string) =>
    //@ts-ignore
    await Record.findByPk<IRecords>(id, { raw: true })
      .then((r1) => ({ ...r1, data: JSON.parse(r1.data as any) }))
      .catch(() => null),
  findOne: async (filter: Partial<Omit<IRecords, 'data'>> = {} as any) =>
    //@ts-ignore
    await Record.findOne<IRecords>({ raw: true, where: filter })
      .then((r1) => ({ ...r1, data: JSON.parse(r1.data as any) }))
      .catch(() => null),
  findOneAndUpdate: async (filter: Partial<Omit<IRecords, 'data'>>, data: Partial<IRecords>) => {
    const record: Model = await Record.findOne({ where: filter }).catch(() => null)

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
      .save()
      // @ts-ignore
      .then((r1) => ({ ...r1.dataValues, data: JSON.parse(r1.dataValues.data) }))
      .catch(() => null)
  },
  findOneAndDelete: async (filter: Partial<Omit<IRecord, 'data'>>) => {
    // @ts-ignore
    return await Record.destroy({ where: filter })
      .then((n) => (n === 0 ? null : n))
      .catch(() => null)
  }
}


const records = new Schema<IRecords>({
  scrapeID: { type: String, default: 'null' },
  url: { type: String, default: 'null' },
  data: {
    Name: { type: String, default: 'null' },
    Firstname: { type: String, default: 'null' },
    Lastname: { type: String, default: 'null' },
    Linkedin: { type: String, default: 'null' },
    Title: { type: String, default: 'null' },
    'Company Name': { type: String, default: 'null' },
    'Company Website': { type: String, default: 'null' },
    'Company Linkedin': { type: String, default: 'null' },
    'Company Twitter': { type: String, default: 'null' },
    'Company Facebook': { type: String, default: 'null' },
    Email: { type: String, default: 'null' },
    isVerified: { type: Boolean, default: false },
    'Company Location': { type: String, default: 'null' },
    Employees: { type: String, default: 'null' },
    Phone: { type: String, default: 'null' },
    Industry: { type: String, default: 'null' },
    Keywords: { type: [String], default: [] }
  }
})

export const RecordsModel = model<IRecords>('record', records)
