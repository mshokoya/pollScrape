import { IMetaData } from '../../../../../shared'
import { cache } from '../../../cache'
import { AccountModel_ } from '../../../database/models/accounts'
import { AppError } from '../../../util'
import { apolloScrape } from '../lib'
import { scraper } from '../lib/scraper'

export const scrape = async (
  {
    taskID,
    chunk,
    accountID,
    metadata,
    useProxy
  }: {
    taskID: string
    chunk: [number, number]
    accountID: string
    metadata: IMetaData
    useProxy: boolean
  },
  signal: AbortSignal
) => {
  let browserCTX_ID: string

  try {
    return await new Promise(async (res, rej) => {
      signal.addEventListener('abort', () => {
        rej({ taskID, message: 'Failed to scrape, task aborted' })
      })

      const browserCTX = await scraper.newBrowser(false)
      if (!browserCTX) throw new AppError(taskID, 'Failed to scrape, browser could not be started')

      browserCTX_ID = browserCTX.id

      if (!browserCTX) throw new AppError(taskID, 'Failed to scrape, browser could not be started')
      const account = await AccountModel_.findById(accountID)
      if (!account) throw new AppError(taskID, 'Failed to scrape, account could not be found')
      await apolloScrape(taskID, browserCTX, metadata, useProxy, account, chunk)
    })
  } finally {
    // (FIX) make sure this works
    await cache.removeAccount(metadata.id, accountID)
    await scraper.close(browserCTX_ID)
  }
}
