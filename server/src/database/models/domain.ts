import { Schema, model } from "mongoose"

export type IDomain = {
  _id: string
  domain: string
  authEmail: string
  verified: boolean
  MXRecords: boolean,
  TXTRecords: boolean,
  VerifyMessage: string
}



const domainSchema = new Schema<IDomain>({
  domain: { type: String, default: "" },
  authEmail: { type: String, default: "" },
  verified: {type: Boolean, default: false},
  MXRecords: {type: Boolean, default: false},
  TXTRecords: {type: Boolean, default: false},
  VerifyMessage: {type: String, default: ''},
});

export const DomainModel = model<IDomain>('domain', domainSchema);