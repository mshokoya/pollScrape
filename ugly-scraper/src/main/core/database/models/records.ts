import { Schema, model } from 'mongoose'
import { Model, Q } from '@nozbe/watermelondb'
import { field, json } from '@nozbe/watermelondb/decorators'
import { database } from '../db'

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

export default class Record extends Model {
  static table = 'record'

  @field('scrapeID') scrapeID
  @field('url') url
  @json('data', (f) => f) data

  static async getAll() {
    // @ts-ignore
    return (await database.get<IRecords>('record').query().fetch()).map((r) => {
      // @ts-ignore
      r.data = JSON.parse(r.data)
      return r
    })
  }

  static async findOneById(id: string): Promise<IRecords | null> {
    return await database
      // @ts-ignore
      .get<IRecords>('record')
      .find(id)
      // @ts-ignore
      .then((r: IAccount) => {
        // @ts-ignore
        r.data = JSON.parse(r.data)
        return r
      })
      .catch(() => null)
  }

  static async find(filter: Partial<Omit<IRecords, 'data'>>) {
    const args = Object.entries(filter).map((r: [string, any]) => Q.where(r[0], r[1]))
    return (
      (
        await database
          .get('record')
          .query(...args)
          .fetch()
          .catch(() => [])
      )
        // @ts-ignore
        .map((r: IAccount) => {
          // @ts-ignore
          r.data = JSON.parse(r.data)
          return r
        })
    )
  }

  static async create(record: Partial<IRecords>) {
    return (await database.write(
      async () =>
        //@ts-ignore
        await database.get('record').create((r: IRecords) => {
          r.scrapeID = record.scrapeID || ''
          r.url = record.url || ''
          // @ts-ignore
          r.data = record.data ? JSON.stringify(record.data) : '{}'
        })
    )) as unknown as IRecords
  }

  static async updateOne(recordID: string, record: Partial<IRecords>) {
    const prox: Model | null = await database
      .get('record')
      .find(recordID)
      .catch(() => null)

    if (!prox) return null

    // @ts-ignore
    return (await prox.update((r: IRecords) => {
      for (const [key, value] of Object.entries(record)) {
        if (key === 'data') {
          // @ts-ignore
          r.data = JSON.stringify(value)
        } else {
          r[key] = value
        }
      }
    })) as IRecords
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
