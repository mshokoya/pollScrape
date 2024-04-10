import { deleteMetaAndRecords, updateMeta } from '../../../database'
import { IMetaData, MetaDataModel_ } from '../../../database/models/metadata'

export const updateMetadata = async (meta: IMetaData) => {
  try {
    if (!meta) throw new Error('valid meta id not provided')

    const newMeta = await updateMeta(meta)

    return { ok: true, message: null, data: newMeta }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

export const deleteMetadata = async (id: string) => {
  try {
    const metaID = id

    if (!metaID) throw new Error('valid meta id not provided')

    await deleteMetaAndRecords(metaID)

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
