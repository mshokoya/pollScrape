import { cache } from '../../../cache'
import { AccountModel, AccountModel_, IAccount } from '../../../database/models/accounts'
import { IMetaData } from '../../../database/models/metadata'
import { AppError } from '../../../util'
import { apolloScrape } from '../lib'
import { scraper } from '../lib/scraper'

export const scrape = async ({
  taskID,
  name,
  chunk,
  accountID,
  metadata,
  useProxy
}: {
  taskID: string
  name: string
  chunk: [number, number]
  accountID: string
  metadata: IMetaData
  useProxy: boolean
}) => {
  try {
    const browserCTX = await scraper.newBrowser(false)
    if (!browserCTX) throw new AppError(taskID, 'Failed to scrape, browser could not be started')
    const account = await AccountModel_.findById(accountID)
    if (!account) throw new AppError(taskID, 'Failed to scrape, account could not be found')
    await apolloScrape(taskID, browserCTX, metadata, useProxy, account, chunk, name)
  } finally {
    // (FIX) CACHE NOW IN DB
    // await cache.deleteMeta(metadata.id)
  }
}
