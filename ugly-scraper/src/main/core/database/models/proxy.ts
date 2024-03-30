import { Schema, model } from 'mongoose'
import { Model, Q } from '@nozbe/watermelondb'
import { field } from '@nozbe/watermelondb/decorators'
import { database } from '../db'

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


  static async getAll() {
    // @ts-ignore
    return await database.get<IProxy>('proxy').query().fetch()
  }

  static async findOneById(id: string): Promise<IProxy | null> {
    return await database
      // @ts-ignore
      .get<IProxy>('proxy')
      .find(id)
      .catch(() => null)
  }

  static async find(filter: IProxy) {
    const args = Object.entries(filter).map((p: [string, any]) => Q.where(p[0], p[1]))
    return await database
      .get('proxy')
      .query(...args)
      .fetch()
      .catch(() => [])
  }

  static async create(proxy: Partial<IProxy>) {
    return (await database.write(
      async () =>
        //@ts-ignore
        await database.get('proxy').create((p: IProxy) => {
          p.proxy = proxy.proxy || ''
          p.protocol = proxy.protocol || ''
          p.host = proxy.host || ''
          p.port = proxy.port || ''
        })
    )) as unknown as IProxy
  }

  static async updateOne(proxyID: string, proxy: Partial<IProxy>) {
    const prox: Model | null = await database
      .get('proxy')
      .find(proxyID)
      .catch(() => null)

    if (!prox) return null

    // @ts-ignore
    const newProx = (await prox.update((p: IProxy) => {
      for (const [key, value] of Object.entries(proxy)) {
        p[key] = value
      }
    })) as IProxy

    return newProx
  }
}

const proxy = new Schema<IProxy>({
  proxy: { type: String, default: '' },
  protocol: { type: String, default: '' },
  host: { type: String, default: '' },
  port: { type: String, default: '' }
})

export const ProxyModel = model<IProxy>('proxies', proxy)
