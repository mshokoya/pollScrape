import { Schema, model } from "mongoose"

export type IAccount = {
  _id: string
  domain: string
  accountType: string
  trialTime: string
  isSuspended: boolean
  loginType: 'default' | 'google' | 'outlook'
  email: string
  password: string
  cookie: string
  proxy: string
  lastUsed: Date
}

const accountSchema = new Schema<IAccount>({
  domain: { type: String, default: "" },
  accountType: { type: String, default: "n/a" }, // free or premuim
  trialTime: { type: String, default: "n/a" }, // should be trial end date & time
  isSuspended: { type: Boolean, default: false },
  loginType: {type: String, default: "default"},
  email: { type: String, default: "" },
  password: { type: String, default: "" },
  cookie: { type: String, default: "" },
  proxy: { type: String, default: "http://000.000.000.000:0000" },
  // @ts-ignore
  lastUsed: { type: Date, default: Date() } // used to pick which to use to scrape
});

export const AccountModel = model<IAccount>('accounts', accountSchema);