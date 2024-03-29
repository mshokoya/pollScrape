import { Schema, model } from 'mongoose'
import { Model } from '@nozbe/watermelondb'
import { field, json } from '@nozbe/watermelondb/decorators'

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
