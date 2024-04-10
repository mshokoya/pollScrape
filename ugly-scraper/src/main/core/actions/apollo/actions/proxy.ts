import { addProxyToDB } from '../../../database'
import { ProxyModel_ } from '../../../database/models/proxy'
import { verifyProxy } from '../../../database/util'

export const getProxies = async () => {
  try {
    const proxies = await ProxyModel_.findAll()

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
