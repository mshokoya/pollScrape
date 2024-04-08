import { Express } from 'express'
import { apolloScrape } from '../actions/apollo/lib'
import { initMeta } from '../database'
import { IMetaData, MetaDataModel_ } from '../database/models/metadata'
import { scraper } from '../actions/apollo/lib/scraper'
import { AppError, generateID} from '../util'
import { taskQueue } from '../task-queue'
import { io } from '../websockets'
import { cache } from '../cache'
import { init } from '../start'

export const scrapeRoutes = (app: Express) => {
  // (FIX) test this function and make sure it works correctly
  app.post('/scrape', async (req, res) => {
    res.json(await scrapeLeads(req.body.id, req.body.proxy, req.body.url))
  })
}

export const scrapeLeads = async (id: string, proxyy: boolean, urll: string) => {
  console.log('scrape')

  const metaID: string = id
  let metadata: IMetaData
  const useProxy: boolean = proxyy || false
  const url = urll

  try {
    // (FIX) test if works
    if (!url) {
      throw new Error(
        'failed to start scraper, invalid scrape parameters, please provide a valid start and end page'
      )
    }

    if (!metaID) {
      metadata = await initMeta(url)
    } else {
      metadata = await MetaDataModel_.findOne({ id: metaID }).then((m) => {
        if (!m) throw new Error('failed to start scraper, could not find metadata')
        return m
      })
    }

    const taskID = generateID()
    await taskQueue.enqueue(
      taskID,
      'apollo',
      'scrape',
      `scrape leads from apollo`,
      { metaID: metaID },
      async () => {
        io.emit('apollo', { taskID, taskType: 'scrape', message: 'starting lead scraper' })
        const browserCTX = await scraper.newBrowser(false)
        try {
          if (!browserCTX)
            throw new AppError(taskID, 'Failed to scrape, browser could not be started')

          await browserCTX.execute(
            { taskID, metadata, useProxy },
            async ({ page, data: { taskID, metadata, useProxy } }) => {
              await init()
              await apolloScrape(taskID, { page }, metadata, useProxy)
            }
          )
        } finally {
          // (FIX) CACHE NOW IN DB
          await cache.deleteMeta(metaID)
          await browserCTX.idle()
          await browserCTX.close()
        }
      }
    )

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message || 'failed to scrape', data: null }
  }
}