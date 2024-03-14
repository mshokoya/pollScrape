import { Schema, model } from "mongoose"

export type IMetaData = {
  _id: string
  url: string
  params: {[key: string]: string}
  name: string
  scrapes: {scrapeID: string, listName: string, length: number, date: number}[]
  accounts: {accountID: string, range:[min:number, max:number]}[]
}

const metaData = new Schema<IMetaData>({
  url: { type: String, default: "" },
  params: { type: Object, default: {} },
  name: { type: String, default: "", unique: true },
  accounts: {type: [Object], default: []}, // IAccount 
  scrapes: { type: [Object], default: []} // [{scrapeID: "", listName: ''}] - is used in Records Model (scrape)
});

export const MetadataModel = model<IMetaData>('metadata', metaData);