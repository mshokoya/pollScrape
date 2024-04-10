import { initMeta } from '../../../database'
import { IMetaData, MetaDataModel_ } from '../../../database/models/metadata'
import { scrapeQueue } from '../../../scrape-queue'
import { taskQueue } from '../../../task-queue'
import { generateID } from '../../../util'
import { io } from '../../../websockets'

export const scrape = async (metaID: string, proxy: boolean, url: string) => {
  console.log('scrape')

  let metadata: IMetaData
  const useProxy = proxy || false

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
        scrapeQueue.enqueue(taskID, 'apollo', 's', { metadata, useProxy })
      }
    )

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message || 'failed to scrape', data: null }
  }
}
