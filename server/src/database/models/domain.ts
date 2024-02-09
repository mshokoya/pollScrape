import { Schema, model } from "mongoose"

export type IDomain = {
  _id: string
  domain: string
  authEmail: string
  verified: boolean
}



const domainSchema = new Schema<IDomain>({
  domain: { type: String, default: "" },
  verified: {type: Boolean, default: false}
});

export const DomainModel = model<IDomain>('domain', domainSchema);