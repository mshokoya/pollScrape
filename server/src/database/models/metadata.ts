import { Schema, model } from "mongoose"

export type IMetaData = {
  _id: string
  url: string
  params: {[key: string]: string}
  fullURL: string
  name: string
  maxPages: string
  page: number
  scrapes: {page: number, scrapeID: string}[]
}

const metaData = new Schema<IMetaData>({
  url: { type: String, default: "" },
  params: { type: Object, default: {} },
  fullURL: { type: String, default: "" },
  name: { type: String, default: "" },
  maxPages: { type: String, default: "" },
  page: { type: Number, default: 0 }, // current page 
  scrapes: { type: [Object], default: []} // [{page: 1, id: ""}] - is use in ApolloDataModel
});

export const MetadataModel = model<IMetaData>('metadata', metaData);