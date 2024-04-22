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
  try {
    if (!ids || !ids.length) throw new Error('valid meta id not provided')

    for (const id of ids) {
      await deleteMetaAndRecords(id)
    }

    return { ok: true, message: null, data: null }
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
