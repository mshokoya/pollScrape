import { initMeta } from '../../../database'
import { IMetaData, MetaDataModel_ } from '../../../database/models/metadata'
import { taskQueue } from '../../../task-queue'
import { generateID } from '../../../util'
import { io } from '../../../websockets'

export const scrape = async ({
  metaID,
  url,
  tasks
}: {
  metaID: string
  url: string
  tasks: { url: string; accountID: string }[]
}) => {
  console.log('scrape')

  let metadata: IMetaData
  const useProxy = proxy || false

  try {
    if (!metaID) {
      metadata = await initMeta(url)
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
      taskType: 'scrape',
      message: `scrape leads from apollo`,
      metadata: { metaID: metaID },
      action: async () => {
        io.emit('apollo', { taskID, taskType: 'scrape', message: 'starting lead scraper' })

        taskQueue.useFork
          ? tasks.forEach((t) =>
              taskQueue.execInFork({
                pid: taskID,
                taskGroup: 'apollo',
                taskType: 'a_s',
                taskArgs: { url: t.url, accountID: t.accountID }
              })
            )
          : tasks.forEach((t) => scrape({ url: t.url, accountID: t.accountID }))
      }
    })

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message || 'failed to scrape', data: null }
  }
}
