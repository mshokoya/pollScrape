import { Schema, model } from "mongoose"

export type IAccount = {
  _id: string
  domain: string
  accountType: string
  trialTime: string
  isSuspended: boolean
  loginType: 'default' | 'gmail' | 'outlook'
  email: string
  password: string
  cookie: string
  proxy: string
  lastUsed: Date
  recoveryEmail: string
  emailCreditsUsed: number
  emailCreditsLimit: number
  renewalDateTime: number | Date
  renewalStartDate: number | Date
  renewalEndDate: number | Date
  trialDaysLeft: number
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
  recoveryEmail: { type: String, default: "" },
  emailCreditsUsed: { type: Number, default: -1 },
  emailCreditsLimit: { type: Number, default: -1 },
  renewalDateTime: { type: Number, default: 0 }, // as Date
  renewalStartDate: { type: Number, default: 0 }, // as Date
  renewalEndDate: { type: Number, default: 0 }, // as Date
  trialDaysLeft: { type: Number, default: -1 },
  // @ts-ignore
  lastUsed: { type: Date, default: Date() } // used to pick which to use to scrape
});

export const AccountModel = model<IAccount>('accounts', accountSchema);