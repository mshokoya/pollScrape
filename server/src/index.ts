import 'dotenv/config'
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import {createServer} from 'node:http';
import { recordRoutes } from './server/record-routes';
import { proxyRoutes } from './server/proxy-routes';
import { accountRoutes } from './server/account-routes';
import { metadataRoutes } from './server/metadata-route';
import { scrapeRoutes } from './server/scrape-routes';
import { initTaskQueue } from './task_queue';
import { initSocketIO } from './websockets';
import { initMailBox } from './mailbox';
import { initForwarder } from './forwarder';
import { domainRoutes } from './server/domain-route';
import { AccountModel } from './database/models/accounts';
import { initCache } from './cache';
import { initPrompt } from './prompt';


const app = express();
const server = createServer(app);
const port = 4000;

//  free proxies
// https://proxyscrape.com/free-proxy-list
// https://geonode.com/free-proxy-list

app.use(cors());
app.use(bodyParser.json());

domainRoutes(app);
metadataRoutes(app);
recordRoutes(app);
proxyRoutes(app);
accountRoutes(app);
scrapeRoutes(app);

app.use((err: any, _req: any, res: any, next: any) => {
  if (res.headersSent) {
    return next(err);
  }
  res.status(500);
  res.render('error', { error: err });
});

mongoose.connect(process.env.MONGOURI!)
  .then(async () => {
    console.log('Mongoose started')

    initCache()
    console.log('Cache started')
    
    initSocketIO(server)
    console.log('SocketIO started')

    initPrompt()
    console.log('Prompt started')

    initTaskQueue()
    console.log('TaskQueue started')

    initForwarder()
    console.log('Forwarder started')

    await initMailBox()
    console.log('Mailbox started')

    server.listen(port, () => {
      console.log(`Connected to server on port ${port}`)
    });

  });

// apollo dialog box (if visible click x to close)
// div[class="apolloio-css-vars-reset zp zp-modal zp_iDDtd"][rol="dialog"]
    // div[class="zp_RB9tu zp_oSFrJ"] 
    //    or 
    //i[class="zp-icon mdi mdi-close zp_dZ0gM zp_foWXB zp_j49HX zp_rzbAy"]