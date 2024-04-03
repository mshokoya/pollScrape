import { RecordModel_ } from '../database/models/records'
import { Express } from 'express'

export const recordRoutes = (app: Express) => {
  app.get('/records', async (req, res) => {
    res.json(await getRecords())
  })

  app.post('/records', async (req, res) => {
    res.json(await getRecord(req.body.id))
  })
}

export const getRecords = async () => {
  console.log('get all records')

  try {
    const records = await RecordModel_.findAll()

    return { ok: true, message: null, data: records }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

export const getRecord = async (id: string ) => {
  console.log('get record')

  try {
    const record = await RecordModel_.findOne({ id })

    if (record === null) throw new Error('cannot find record')

    return { ok: true, message: null, data: record }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}
