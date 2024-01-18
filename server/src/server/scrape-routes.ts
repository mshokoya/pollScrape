import { Express } from 'express';
import { startScrapingApollo } from '../scraper';
import { initMeta } from '../database';
import { IMetaData } from '../database/models/metadata';


export const scrapeRoutes = (app: Express) => {

  app.post('/scrape', async (req, res) => {
    let metadata: IMetaData;
    const from = parseInt(req.body.from);
    const to = parseInt(req.body.to)
    try {

      if (req.body.meta) {
        metadata = req.body.meta
      } else {
        metadata = await initMeta(req.body.urls[0])
      }

      for (let i = from; i <= to; i++) {
        const url = new URL(req.body.url);
        const search_params = url.searchParams;
        
        search_params.set('page', i.toString())
        url.search = search_params.toString();

        const newUrl = url.toString()

        await startScrapingApollo(
          metadata._id,
          newUrl,
          req.body.proxy
        )
      }
  
      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message || 'failed to scrape' , data: null});
    }
  });

}