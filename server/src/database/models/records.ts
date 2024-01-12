import { Schema, Types, model } from "mongoose"

export type IRecords = {
  scrapeID: string
  url: string
  page: string
  data: IRecord
}

export type IRecord = {
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

const records = new Schema<IRecords>({
  scrapeID: { type: String, default: "null" },
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
});

export const RecordsModel = model<IRecords>('record', records);