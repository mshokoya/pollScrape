import { Express } from 'express';
import { IMetaData, MetadataModel } from '../database/models/metadata';
import { deleteMetaAndRecords, updateMeta } from '../database';


export const metadataRoutes = (app: Express) => {

  app.get('/metadata', async (req, res) => {
    console.log('get all metadata');
    try {
      const metadata = await MetadataModel.find({}).lean();
  
      res.json({ok: true, message: null, data: metadata});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  });

  app.delete('/metadata/:id', async (req, res) => {
    try {
      const metaID = req.params.id;

      if (!metaID) throw new Error('valid meta id not provided')

      await deleteMetaAndRecords(metaID)

      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  })

  app.put('/metadata', async (req, res) => {
    try {
      const meta = req.body.meta as IMetaData;

      if (!meta) throw new Error('valid meta id not provided')

      const newMeta = await updateMeta(meta) 

      res.json({ok: true, message: null, data: newMeta});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  });

}

