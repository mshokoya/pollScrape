import { Schema, Types, model } from "mongoose"

export type IRecords = {
  _id: string
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
    Name: { type: String, default: "null" },
    Firstname: { type: String, default: "null" },
    Lastname: { type: String, default: "null" },
    Linkedin: { type: String, default: "null" },
    Title: { type: String, default: "null" },
    companyName: { type: String, default: "null" },
    'Company Website': { type: String, default: "null" },
    'Company Linkedin': { type: String, default: "null" },
    'Company Twitter': { type: String, default: "null" },
    'Company Facebook': { type: String, default: "null" },
    Email: { type: String, default: "null" },
    isVerified: { type: Boolean, default: false },
    'Company Location': { type: String, default: "null" },
    Employees: { type: String, default: "null" },
    Phone: { type: String, default: "null" },
    Industry: { type: String, default: "null" },
    Keywords: { type: [String], default: [] }
  }
});

export const RecordsModel = model<IRecords>('record', records);

Request Mobile Number