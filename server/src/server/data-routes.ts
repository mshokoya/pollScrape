import { startScrapingApollo } from "../scraper";
import { Express } from 'express';


export const dataRoutes = (app: Express) => {

  app.post('/scrape', async (req, res) => {
    console.log('start scraping');
    try {
      await startScrapingApollo(req.body.url);
  
      res.json({ok: true, message: null, data: null});
    } catch (err) {
      res.json({ok: false, message: 'failed to proxy', data: err});
    }
  
  });

}

