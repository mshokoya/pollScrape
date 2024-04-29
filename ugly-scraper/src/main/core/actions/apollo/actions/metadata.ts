import { IMetaData } from '../../../../../shared'
import { deleteMetaAndRecords, updateMeta } from '../../../database'
import { MetaDataModel_ } from '../../../database/models/metadata'

export const updateMetadata = async (meta: IMetaData) => {
  try {
    if (!meta) throw new Error('valid meta id not provided')

    const newMeta = await updateMeta(meta)

    return { ok: true, message: null, data: newMeta }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

export const deleteMetadata = async (ids: string[]) => {
  const del: any = { ok: [], fail: [] }
  try {
    if (!ids || !ids.length) throw new Error('valid meta id not provided')

    for (const id of ids) {
      await deleteMetaAndRecords(id)
        .then(() => del.ok.push(id))
        .catch(() => del.fail.push(id))
    }

    return { ok: true, message: null, data: del }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

export const getMetadatas = async () => {
  console.log('get all metadata')
  try {
    const metadata = await MetaDataModel_.findAll()

    return { ok: true, message: null, data: metadata }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}
