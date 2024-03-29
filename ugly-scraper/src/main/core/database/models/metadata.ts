import { Schema, model } from 'mongoose'
import { Model } from '@nozbe/watermelondb'
import { field, text, json } from '@nozbe/watermelondb/decorators'

export type IMetaData = {
  _id: string
  url: string
  params: { [key: string]: string }
  name: string
  scrapes: { scrapeID: string; listName: string; length: number; date: number }[]
  accounts: { accountID: string; range: [min: number, max: number] }[]
}

export default class MetaData extends Model {
  static table = 'metadata'

  @field('url') url
  @json('params', (f) => f) params
  @text('name') name
  @json('accounts', (f) => f) accounts
  @json('scrapes', (f) => f) scrapes
}

const metaData = new Schema<IMetaData>({
  url: { type: String, default: '' },
  params: { type: Object, default: {} },
  name: { type: String, default: '', unique: true },
  accounts: { type: [Object], default: [] }, // IAccount
  scrapes: { type: [Object], default: [] } // [{scrapeID: "", listName: ''}] - is used in Records Model (scrape)
})

export const MetadataModel = model<IMetaData>('metadata', metaData)
