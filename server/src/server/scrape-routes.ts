import { Express } from 'express';
import { startScrapingApollo } from '../scraper';
import { initMeta } from '../database';
import { IMetaData } from '../database/models/metadata';
import { scraper } from '../scraper/scraper';


export const scrapeRoutes = (app: Express) => {

  app.post('/scrape', async (req, res) => {
    // let metadata: IMetaData;
    let metadata: IMetaData = req.body.meta;
    let start: number | undefined;
    let end: number | undefined;
    let useProxy: boolean = req.body.url;
    const url = req.body.url;

    await scraper.launchBrowser()

  //   try {

  //     if (!start || !end || !url ) {
  //       throw new Error('invald fields')
  //     }

  //     start = parseInt(req.body.start);
  //     end = parseInt(req.body.end);

  //     if (!useProxy) {
  //       useProxy = req.body.proxy;
  //     }
      
  //     if (!metadata) {
  //       metadata = await initMeta(req.body.urls)
  //     }

  //     for (let i = start; i <= end; i++) {
  //       const fmtURL = new URL(url);
  //       const search_params = fmtURL.searchParams;
        
  //       search_params.set('page', i.toString());
  //       fmtURL.search = search_params.toString();

  //       const newUrl = fmtURL.toString();

  //       await startScrapingApollo(
  //         metadata._id,
  //         newUrl,
  //         useProxy
  //       );
  //     }
  
  //     res.json({ok: true, message: null, data: null});
  //   } catch (err: any) {
  //     scraper.close()
  //     res.json({ok: false, message: err.message || 'failed to scrape' , data: null});
  //   }
  });

}