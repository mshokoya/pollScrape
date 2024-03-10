import { Express } from 'express';
import { apolloScrape } from '../scraper/apollo';
import { initMeta } from '../database';
import { IMetaData, MetadataModel } from '../database/models/metadata';
import { scraper } from '../scraper/apollo/scraper';
import { AppError, generateID, getDomain, isNumber } from '../util';
import { taskQueue } from '../task_queue';
import { io } from '../websockets';
import { cache } from '../cache';


export const scrapeRoutes = (app: Express) => {

  // (FIX) test this function and make sure it works correctly
  app.post('/scrape', async (req, res) => {
    console.log('scrape')

    let metaID: string = req.body.id;
    let metadata: IMetaData;
    let useProxy: boolean = req.body.proxy || false;
    const url = req.body.url;

    try {
      // (FIX) test if works
      if (!url) {
        throw new Error('failed to start scraper, invalid scrape parameters, please provide a valid start and end page')
      }
      
      if (!metaID) {
        metadata = await initMeta(url)
      } else {
        metadata = await MetadataModel.findOne({_id:metaID})
          .then((m) => {
            if (!m) throw new Error('failed to start scraper, could not find metadata')
            return m
          })
      }

      const taskID = generateID()
      await taskQueue.enqueue(
        taskID,
        'apollo',
        'scrape',
        `scrape leads from apollo`,
        {metaID: metaID},
        async () => {
          io.emit( 'apollo', { taskID, taskType: 'scrape', message: 'starting lead scraper' } );
          const browserCTX = await scraper.newBrowser(false)
          if (!browserCTX) throw new AppError(taskID, 'Failed to scrape, browser could not be started')
          try {
            await apolloScrape(taskID, browserCTX, metadata, useProxy)
          } finally {
            await cache.deleteMeta(metaID)
            await scraper.close(browserCTX)
          }
        }
      )

      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message || 'failed to scrape' , data: null});
    }
  });

}