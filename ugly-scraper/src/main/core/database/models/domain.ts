import { Schema, model } from 'mongoose'
import { Model, Q } from '@nozbe/watermelondb'
import { field } from '@nozbe/watermelondb/decorators'
import { database } from '../db'

export type IDomain = {
  _id: string
  domain: string
  authEmail: string
  authPassword: string
  verified: boolean
  MXRecords: boolean
  TXTRecords: boolean
  VerifyMessage: string
}

export default class Domain extends Model {
  static table = 'domain'

  @field('domain') domain
  @field('authEmail') authEmail
  @field('authPassword') authPassword
  @field('verified') verified
  @field('MXRecords') MXRecords
  @field('TXTRecords') TXTRecords
  @field('VerifyMessage') VerifyMessage

  static async getAll() {
    // @ts-ignore
    return await database.get<IDomain>('domain').query().fetch()
  }

  static async findOneById(id: string): Promise<IDomain | null> {
    return await database
      // @ts-ignore
      .get<IDomain>('domain')
      .find(id)
      .catch(() => null)
  }

  static async find(filter: IDomain) {
    const args = Object.entries(filter).map((a: [string, any]) => Q.where(a[0], a[1]))
    return await database
      .get('domain')
      .query(...args)
      .fetch()
      .catch(() => [])
  }

  static async create(domain: Partial<IDomain>) {
    return (await database.write(
      async () =>
        //@ts-ignore
        await database.get('domain').create((d: IDomain) => {
          d.domain = domain.domain || ''
          d.authEmail = domain.authEmail || ''
          d.authPassword = domain.authPassword || ''
          d.verified = domain.verified || false
          d.MXRecords = domain.MXRecords || false
          d.TXTRecords = domain.TXTRecords || false
          d.VerifyMessage = domain.VerifyMessage || ''
        })
    )) as unknown as IDomain
  }

  static async updateOne(domainID: string, domain: Partial<IDomain>) {
    const dom: Model | null = await database
      .get('domain')
      .find(domainID)
      .catch(() => null)

    if (!dom) return null

    // @ts-ignore
    const newD = (await dom.update((d: IDomain) => {
      for (const [key, value] of Object.entries(domain)) {
        d[key] = value
      }
    })) as IDomain

    return newD
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
