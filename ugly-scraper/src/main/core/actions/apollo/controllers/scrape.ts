import { IMetaData } from '../../../../../shared'
import { CHANNELS } from '../../../../../shared/util'
import { cache } from '../../../cache'
import { initMeta } from '../../../database'
import { MetaDataModel_ } from '../../../database/models/metadata'
import { taskQueue } from '../../../task-queue'
import { generateID } from '../../../util'
import { io } from '../../../websockets'
import { scrape } from '../actions'

export const Tscrape = async ({
  name,
  metaID,
  url,
  accounts,
  chunk,
  useProxy
}: {
  name: string
  url: string
  chunk: [number, number][]
  accounts: string[]
  metaID?: string
  useProxy: boolean
}) => {
  console.log('scrape')

  let metadata: IMetaData

  try {
    if (!metaID) {
      metadata = await initMeta(name, url)
      for (let i = 0; i < accounts.length; i++) {
        metadata.accounts.push({ accountID: accounts[i], range: chunk[i] })
      }
      metadata = await MetaDataModel_.findOneAndUpdate({ id: metadata.id }, metadata)
    } else {
      metadata = await MetaDataModel_.findOne({ id: metaID }).then((m) => {
        if (!m) throw new Error('failed to start scraper, could not find metadata')
        return m
      })
    }
    metaID = metadata.id

    const taskID = generateID()
    await taskQueue.enqueue({
      taskID,
      taskGroup: 'apollo',
      useFork: taskQueue.useFork,
      taskType: 'scrape',
      message: `scrape leads from apollo`,
      metadata: { metaID: metaID },
      action: async () => {
        io.emit('apollo', { taskID, taskType: 'scrape', message: 'starting lead scraper' })

        if (taskQueue.useFork) {
          for (let i = 0; i < accounts.length; i++) {
            taskQueue.execInFork({
              pid: taskID,
              taskGroup: 'apollo',
              action: CHANNELS.a_scrape,
              args: { chunk: chunk[i], accountID: accounts[i], metadata, useProxy },
              metadata: {
                taskType: CHANNELS.a_scrape,
                taskGroup: 'apollo',
                metadata: { metaID: metaID }
              }
            })
          }
          return taskQueue.EXEC_FORK
        } else {
          // (FIX) check if works
          const arr = []
          for (let i = 0; i < accounts.length; i++) {
            arr.push(
              scrape({ chunk: chunk[i], accountID: accounts[i], metadata, useProxy, taskID })
            )
          }
          return await Promise.allSettled(arr)
        }
      }
    })

    await cache.addAccounts(metaID, accounts)

    return { ok: true, message: null, data: metadata }
  } catch (err: any) {
    return { ok: false, message: err.message || 'failed to scrape', data: null }
  }
}
