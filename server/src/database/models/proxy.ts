import { Schema, model } from "mongoose";

export type IProxy = {
  proxy: string
  protocol: string,
  host: string
  port: string
}

const proxy = new Schema<IProxy>({
  proxy: { type: String, default: "" },
  protocol: { type: String, default: "" },
  host: { type: String, default: "" },
  port: { type: String, default: "" }
});

export const ProxyModel = model<IProxy>('proxies', proxy);