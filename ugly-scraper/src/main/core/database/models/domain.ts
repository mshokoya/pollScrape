import { Schema, model } from 'mongoose'
import { Model } from '@nozbe/watermelondb'
import { field } from '@nozbe/watermelondb/decorators'

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
