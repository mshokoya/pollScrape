import { RecordsModel } from "../database/models/records";
import { startScrapingApollo } from "../scraper";
import { Express } from 'express';


export const recordRoutes = (app: Express) => {

  app.get('/records', async (req, res) => {
    console.log('start scraping');
    try {
      const records = await RecordsModel.find({}).lean();
  
      res.json({ok: true, message: null, data: records});
    } catch (err) {
      res.json({ok: false, message: 'failed to get records', data: err});
    }
  
  });

}

