import { Schema, model } from "mongoose"

export type IAccount = {
  domain: string
  accountType: string
  trialTime: string
  isSuspended: boolean
  apollo: {
    email: string
    password: string
  },
  cookies: string
  proxy: string
  lastUsed: Date
}

const accountSchema = new Schema<IAccount>({
  domain: { type: String, default: "" },
  accountType: { type: String, default: "n/a" }, // free or premuim
  trialTime: { type: String, default: "" },
  isSuspended: { type: Boolean, default: false },
  apollo: {
    email: { type: String, default: "" },
    password: { type: String, default: "" }
  },
  cookies: { type: String, default: "" },
  proxy: { type: String, default: "http://000.000.000.000:0000" },
  // @ts-ignore
  lastUsed: { type: Date, default: Date() } // used to pick which to use to scrape
});

export const AccountModel = model<IAccount>('account', accountSchema);