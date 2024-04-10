import { cache } from '../../../cache'
import { IMetaData } from '../../../database/models/metadata'
import { AppError } from '../../../util'
import { scraper } from '../lib/scraper'

export const scrape = async ({
  taskID,
  useProxy,
  metadata
}: {
  taskID: string
  useProxy: boolean
  metadata: IMetaData
}) => {
  const browserCTX = await scraper.newBrowser(false)
  try {
    if (!browserCTX) throw new AppError(taskID, 'Failed to scrape, browser could not be started')

    await browserCTX.execute(
      { taskID, metadata, useProxy },
      async ({ page, data: { taskID, metadata, useProxy } }) => {
        await init()
        await apolloScrape(taskID, { page }, metadata, useProxy)
      }
    )
  } finally {
    // (FIX) CACHE NOW IN DB
    await cache.deleteMeta(metadata.id)
    await browserCTX.idle()
    await browserCTX.close()
  }
}
