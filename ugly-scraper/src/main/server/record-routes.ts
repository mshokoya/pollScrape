import { RecordsModel } from "../database/models/records";
import { Express } from 'express';


export const recordRoutes = (app: Express) => {

  app.get('/records', async (req, res) => {
    console.log('get all records');
    try {
      const records = await RecordsModel.find({}).lean();
  
      res.json({ok: true, message: null, data: records});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  });

  app.post('/records', async (req, res) => {
    console.log('get record');

    try {
      const record = await RecordsModel.findOne({_id: req.body._id}).lean()

      if (record === null) throw new Error('cannot find record') 

      res.json({ok: true, message: null, data: record});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  })

}

