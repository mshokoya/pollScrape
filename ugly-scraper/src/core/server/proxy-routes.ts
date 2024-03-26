import { Express } from 'express'
import { verifyProxy } from '../database/util'
import { addProxyToDB } from '../database'
import { ProxyModel } from '../database/models/proxy'

export const proxyRoutes = (app: Express) => {
  app.get('/proxy', async (req, res) => {
    res.json(await getProxies())
  })

  app.post('/addproxy', async (req, res) => {
    res.json(await addProxy(req.body.url, req.body.proxy))
  })
}

export const getProxies = async () => {
  try {
    const proxies = await ProxyModel.find({}).lean()

    return { ok: true, message: null, data: proxies }
  } catch (err) {
    return { ok: false, message: 'failed to proxy', data: err }
  }
}

export const addProxy = async (url: string, proxy: string) => {
  console.log('addproxy')
  try {
    const proxyRes = await verifyProxy(url)

    if (proxyRes.valid) {
      await addProxyToDB(proxy)
    }

    return { ok: true, message: null, data: null }
  } catch (err) {
    return { ok: false, message: 'failed to proxy', data: err }
  }
}
