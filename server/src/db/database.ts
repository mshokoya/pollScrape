import {connect, model, Schema, Types} from 'mongoose';

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

export type IApolloMetaData = {
  url: string
  params: {[key: string]: string}
  fullURL: string
  name: string
  maxPages: string
  page: number
  scrapes: {page: number, scrapeID: string}[]
}

export type IApolloData = {
  scrapeID: string
  account: string[]
  url: string
  page: string
  data: {
    name: string
    linkedin: string
    title: string
    companyName: string
    companyURL: string
    comapnyLinkedin: string
    companyTwitter: string
    companyFacebook: string
    email: string
    isVerified: boolean
    location: string
    employees: string
    phone: string
    industry: string
    keywords: string[]
  }
}

export type IProxy = {
  proxy: string
  protocol: string,
  ipAddress: string
  port: string
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
})


const apolloMetaData = new Schema<IApolloMetaData>({
  url: { type: String, default: "" },
  params: { type: Object, default: {} },
  fullURL: { type: String, default: "" },
  name: { type: String, default: "" },
  maxPages: { type: String, default: "" },
  page: { type: Number, default: 0 }, // current page 
  scrapes: { type: [Object], default: []} // [{page: 1, scrapeID: ""}] - is use in ApolloDataModel
})

// TODO: 
//  might want to save cookes and proxy used for scrape

const apolloData = new Schema<IApolloData>({
  scrapeID: { type: String, default: "null" },
  account: { type: [Types.ObjectId], default: [] },
  url: { type: String, default: "null" },
  page: { type: String, default: "null" },
  data: {
    name: { type: String, default: "null" },
    linkedin: { type: String, default: "null" },
    title: { type: String, default: "null" },
    companyName: { type: String, default: "null" },
    companyURL: { type: String, default: "null" },
    comapnyLinkedin: { type: String, default: "null" },
    companyTwitter: { type: String, default: "null" },
    companyFacebook: { type: String, default: "null" },
    email: { type: String, default: "null" },
    isVerified: { type: Boolean, default: false },
    location: { type: String, default: "null" },
    employees: { type: String, default: "null" },
    phone: { type: String, default: "null" },
    industry: { type: String, default: "null" },
    keywords: { type: [String], default: [] }
  }
})

const proxy = new Schema<IProxy>({
  proxy: { type: String, default: "" },
  protocol: { type: String, default: "" },
  ipAddress: { type: String, default: "" },
  port: { type: String, default: "" }
})

export const AccountModel = model<IAccount>('account', accountSchema);
export const ApolloMetadataModel = model<IApolloMetaData>('apollo', apolloMetaData);
export const ApolloDataModel = model<IApolloData>('apolloData', apolloData);
export const ProxyModel = model<IProxy>('proxy', proxy);