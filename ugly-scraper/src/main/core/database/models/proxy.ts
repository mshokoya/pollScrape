import { Schema, model } from 'mongoose'
import { Model } from '@nozbe/watermelondb'
import { field } from '@nozbe/watermelondb/decorators'

export type IProxy = {
  _id: string
  proxy: string
  protocol: string
  host: string
  port: string
}

export default class Proxy extends Model {
  static table = 'proxy'

  @field('proxy') proxy
  @field('protocol') protocol
  @field('host') host
  @field('port') port
}

const proxy = new Schema<IProxy>({
  proxy: { type: String, default: '' },
  protocol: { type: String, default: '' },
  host: { type: String, default: '' },
  port: { type: String, default: '' }
})

export const ProxyModel = model<IProxy>('proxies', proxy)
