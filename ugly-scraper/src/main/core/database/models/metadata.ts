import { Schema, model } from 'mongoose'
import { Model, Q } from '@nozbe/watermelondb'
import { field, text, json } from '@nozbe/watermelondb/decorators'
import { database } from '../db'

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

  static async getAll() {
    // @ts-ignore
    return (await database.get<IMetaData>('metadata').query().fetch()).map((m) => {
      // @ts-ignore
      m.params = JSON.parse(m.params)
      // @ts-ignore
      m.scrapes = JSON.parse(m.scrapes)
      // @ts-ignore
      m.accounts = JSON.parse(m.accounts)
      return m
    })
  }

  static async findOneById(id: string): Promise<IMetaData | null> {
    return await database
      // @ts-ignore
      .get<IMetaData>('metadata')
      .find(id)
      .then((m) => {
        // @ts-ignore
        m.params = JSON.parse(m.params)
        // @ts-ignore
        m.scrapes = JSON.parse(m.scrapes)
        // @ts-ignore
        m.accounts = JSON.parse(m.accounts)
        return m
      })
      .catch(() => null)
  }

  static async find(filter: IMetaData) {
    const args = Object.entries(filter).map((m: [string, any]) => Q.where(m[0], m[1]))
    return (
      (
        await database
          .get('metadata')
          .query(...args)
          .fetch()
          .catch(() => [])
      )
        // @ts-ignore
        .map((m: IMetaData) => {
          // @ts-ignore
          m.params = JSON.parse(m.params)
          // @ts-ignore
          m.scrapes = JSON.parse(m.scrapes)
          // @ts-ignore
          m.accounts = JSON.parse(m.accounts)
          return m
        })
    )
  }

  static async create(metadata: Partial<IMetaData>) {
    return (await database.write(
      async () =>
        //@ts-ignore
        await database.get('metadata').create((m: IMetaData) => {
          m.url = metadata.url || ''
          //@ts-ignore
          m.params = metadata.params ? JSON.stringify(metadata.params) : '{}'
          m.name = metadata.name || ''
          //@ts-ignore
          m.scrapes = metadata.scrapes ? JSON.stringify(metadata.scrapes) : '[]'
          //@ts-ignore
          m.accounts = metadata.accounts ? JSON.stringify(metadata.account) : '[]'
        })
    )) as unknown as IMetaData
  }

  static async updateOne(metaID: string, meta: Partial<IMetaData>) {
    const met: Model | null = await database
      .get('metadata')
      .find(metaID)
      .catch(() => null)

    if (!met) return null

    // @ts-ignore
    const newMeta = (await met.update((m: IMetaData) => {
      for (const [key, value] of Object.entries(meta)) {
        if (key === 'params' || key === 'scrapes' || key === 'accounts') {
          // @ts-ignore
          m[key] = JSON.stringify(value)
        } else {
          m[key] = value
        }
      }
    })) as IMetaData

    return newMeta
  }
}

const metaData = new Schema<IMetaData>({
  url: { type: String, default: '' },
  params: { type: Object, default: {} },
  name: { type: String, default: '', unique: true },
  accounts: { type: [Object], default: [] }, // IAccount
  scrapes: { type: [Object], default: [] } // [{scrapeID: "", listName: ''}] - is used in Records Model (scrape)
})

export const MetadataModel = model<IMetaData>('metadata', metaData)
