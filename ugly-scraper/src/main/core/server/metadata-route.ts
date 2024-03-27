import { Express } from 'express'
import { IMetaData, MetadataModel } from '../database/models/metadata'
import { deleteMetaAndRecords, updateMeta } from '../database'

export const metadataRoutes = (app: Express) => {
  app.get('/metadata', async (req, res) => {
    await res.json(await getMetadatas())
  })

  app.delete('/metadata/:id', async (req, res) => {
    await res.json(await deleteMetadata(req.params.id))
  })

  app.put('/metadata', async (req, res) => {
    res.json(await updateMetadata(req.body.meta))
  })
}

export const updateMetadata = async (metaa: IMetaData) => {
  try {
    const meta = metaa

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
    const metadata = await MetadataModel.find({}).lean()

    return { ok: true, message: null, data: metadata }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}