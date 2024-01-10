import { Express } from 'express';
import { MetadataModel } from '../database/models/metadata';


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

}

