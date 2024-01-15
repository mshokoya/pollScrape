import { Express } from 'express';
import { startScrapingApollo } from '../scraper';
import { initMeta } from '../database';


export const scrapeRoutes = (app: Express) => {

  app.post('/scrape', async (req, res) => {
    try {
      const metaData = await initMeta(req.body.url)

      await startScrapingApollo(
        metaData._id,
        req.body.urls,
        req.body.usingProxy
      )
  
      res.json({ok: true, message: null, data: null});
    } catch (err) {
      res.json({ok: false, message: 'failed to proxy', data: err});
    }
  });

}