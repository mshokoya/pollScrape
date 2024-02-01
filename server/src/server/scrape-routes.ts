import { Express } from 'express';
import { startScrapingApollo } from '../scraper';
import { initMeta } from '../database';
import { IMetaData, MetadataModel } from '../database/models/metadata';
import { scraper } from '../scraper/scraper';
import { isNumber } from '../helpers';


export const scrapeRoutes = (app: Express) => {

  // (FIX) test this function and make sure it works correctly
  app.post('/scrape', async (req, res) => {
    // let metadata: IMetaData;
    let start: number = req.body.start;
    let end: number = req.body.end;
    let metaID: string = req.body.id;
    let metadata: IMetaData;
    let useProxy: boolean = req.body.proxy;
    let pageToStartScrapingFrom: number;
    const url = req.body.url;

    try {
      // (FIX) test if works
      if ( 
        (!start || !end || !isNumber(start) || !isNumber(end) || start > end) &&
        !metaID
      ) {
        throw new Error('failed to start scraper, invalid scrape parameters, please provide a valid start and end page')
      }
    
      if (!useProxy) {
        useProxy = false;
      }
      
      if (!metaID) {
        metadata = await initMeta(req.body.urls, start, end)
        metaID = metadata._id
        pageToStartScrapingFrom = start
      } else {
        metadata = await MetadataModel.findOne({_id:metaID})
          .then((m) => {
            if (!m) throw new Error('failed to start scraper, could not find metadata')
            return m
          })
        pageToStartScrapingFrom = metadata.page + 1
      }

      for (let i = pageToStartScrapingFrom; i <= metadata.end; i++) {
        const fmtURL = new URL(url);
        const search_params = fmtURL.searchParams;
        
        search_params.set('page', i.toString());
        fmtURL.search = search_params.toString();

        const newUrl = fmtURL.toString();

        await startScrapingApollo(
          metadata._id,
          newUrl,
          useProxy
        );
      }

      await scraper.close()
      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      await scraper.close()
      res.json({ok: false, message: err.message || 'failed to scrape' , data: null});
    }
  });

}