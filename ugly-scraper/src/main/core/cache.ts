import { Mutex } from 'async-mutex'
import { createServer } from 'node:http'
import { AddressInfo } from 'node:net'

const cacheReq = {
  cr_get: '/g',
  cr_delete: '/d',
  cr_deleteMeta: '/dm',
  cr_getMeta: '/gm',
  cr_addAccounts: '/aa',
  cr_removeAccount: '/ra',
  cr_getAllMetaIDs: '/gami',
  cr_getAllAccountIDs: '/gaai'
}

type ICache = { [key: string]: any } & { meta: { [metadataID: string]: string[] } }
const Cache = () => {
  const _CLock = new Mutex()
  const c: ICache = { meta: { _: [] } }

  return {
    get: async (key: string) => await _CLock.runExclusive(() => c[key]),
    // set: async (key: string, value: any) => await _CLock.runExclusive(() => {c[key] = value}),
    delete: async (key: string) =>
      await _CLock.runExclusive(() => {
        delete c[key]
      }),
    // meta
    deleteMeta: async (metaID: string) =>
      await _CLock.runExclusive(() => {
        delete c.meta[metaID]
      }),
    getMeta: async (metaID: string) => await _CLock.runExclusive(() => c.meta[metaID]),
    addAccounts: async (metaID: string, accountIDs: string[]) =>
      await _CLock.runExclusive(() => {
        !c.meta[metaID] ? (c.meta[metaID] = accountIDs) : c.meta[metaID].concat(accountIDs)
      }),
    removeAccount: async (metaID: string, accountID: string) =>
      await _CLock.runExclusive(() => {
        if (c.meta[metaID]) {
          c.meta.length
            ? (c.meta[metaID] = c.meta[metaID].filter((aID) => aID !== accountID))
            : delete c.meta[metaID]
        }
      }),
    getAllMetaIDs: async () => await _CLock.runExclusive(() => Object.keys(c.meta)),
    getAllAccountIDs: async () => await _CLock.runExclusive(() => Object.values(c.meta).flat())
  }
}

// https://dev.to/richardeschloss/nodejs-portfinding-three-approaches-compared-f1g
export const cacheServer = (cache: ReturnType<typeof Cache>) => {
  const server = createServer(async (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })

    switch (req.url) {
      case cacheReq.cr_get: {
        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', async () => {
          res.end(JSON.stringify(await cache.get(body)))
        })
        break
      }
      case cacheReq.cr_delete: {
        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', async () => {
          res.end(JSON.stringify(await cache.delete(body)))
        })
        break
      }
      case cacheReq.cr_deleteMeta: {
        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', async () => {
          res.end(JSON.stringify(await cache.deleteMeta(body)))
        })
        break
      }
      case cacheReq.cr_getMeta: {
        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', async () => {
          res.end(JSON.stringify(await cache.getMeta(body)))
        })
        break
      }
      case cacheReq.cr_addAccounts: {
        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', async () => {
          const { metaID, accountIDs } = JSON.parse(body)
          res.end(JSON.stringify(await cache.addAccounts(metaID, accountIDs)))
        })
        break
      }
      case cacheReq.cr_removeAccount: {
        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', async () => {
          const { metaID, accountID } = JSON.parse(body)
          res.end(JSON.stringify(await cache.removeAccount(metaID, accountID)))
        })
        break
      }
      case cacheReq.cr_getAllMetaIDs: {
        res.end(JSON.stringify(await cache.getAllMetaIDs()))
        break
      }
      case cacheReq.cr_getAllAccountIDs: {
        res.end(JSON.stringify(await cache.getAllAccountIDs()))
        break
      }
    }
  })
    .listen(0, 'localhost')
    .on('error', () => {
      // (FIX) close entire app if server closes, or errors (look for other events that may be relevant)
      'close whole app'
    })

  return (server.address() as AddressInfo).port
}

export let cache: ReturnType<typeof Cache>
// if port is provided then we are in a fork
export const initCache = () => {
  const init = Cache()
  if (!global.forkID) global.cacheHTTPPort = cacheServer(init)
  const address = global.forkID ? `http://localhost:${global.cacheHTTPPort}` : null

  cache = global.forkID
    ? {
        get: async (key: string) => {
          return await fetch(address + cacheReq.cr_get, { body: key }).then(
            async (r) => await r.json()
          )
        },
        delete: async (key: string) => {
          await fetch(address + cacheReq.cr_delete, { body: key })
        },
        deleteMeta: async (metaID: string) => {
          await fetch(address + cacheReq.cr_deleteMeta, { body: metaID })
        },
        getMeta: async (metaID: string) => {
          return await fetch(address + cacheReq.cr_getMeta, { body: metaID }).then(
            async (r) => await r.json()
          )
        },
        addAccounts: async (metaID: string, accountIDs: string[]) => {
          await fetch(address + cacheReq.cr_addAccounts, {
            body: JSON.stringify({ metaID, accountIDs })
          })
        },
        removeAccount: async (metaID: string, accountID: string) => {
          await fetch(address + cacheReq.cr_removeAccount, {
            body: JSON.stringify({ metaID, accountID })
          })
        },
        getAllMetaIDs: async () => {
          return fetch(address + cacheReq.cr_getAllMetaIDs).then(async (r) => await r.json())
        },
        getAllAccountIDs: async () => {
          return fetch(address + cacheReq.cr_getAllAccountIDs).then(async (r) => await r.json())
        }
      }
    : init
}
