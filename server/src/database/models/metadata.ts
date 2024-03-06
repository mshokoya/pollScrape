import { Schema, model } from "mongoose"

export type IMetaData = {
  _id: string
  url: string
  params: {[key: string]: string}
  name: string
  maxPages: string
  page: number
  start: number;
  end: number;
  scrapes: {scrapeID: string, listName: string}[]
  accounts: {accountID: string, range:[min:number, max:number]}[]
}

const metaData = new Schema<IMetaData>({
  url: { type: String, default: "" },
  params: { type: Object, default: {} },
  name: { type: String, default: "" },
  maxPages: { type: String, default: "" },
  page: { type: Number, default: 0 }, // current page 
  start: { type: Number, default: 0 },
  end: { type: Number, default: 0 },
  accounts: {type: [Object], default: []}, // IAccount 
  scrapes: { type: [Object], default: []} // [{scrapeID: "", listName: ''}] - is used in Records Model (scrape)
});

export const MetadataModel = model<IMetaData>('metadata', metaData);