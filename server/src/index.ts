import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import {createServer} from 'node:http';
import { recordRoutes } from './server/record-routes';
import { proxyRoutes } from './server/proxy-routes';
import { accountRoutes } from './server/account-routes';
import { metadataRoutes } from './server/metadata-route';


const app = express();
const server = createServer(app);
const port = 4000;

//  free proxies
// https://proxyscrape.com/free-proxy-list
// https://geonode.com/free-proxy-list

app.use(cors());
app.use(bodyParser.json());

metadataRoutes(app);
recordRoutes(app);
proxyRoutes(app);
accountRoutes(app);

app.use((err: any, _req: any, res: any, next: any) => {
  if (res.headersSent) {
    return next(err);
  }
  res.status(500);
  res.render('error', { error: err });
});

mongoose.connect('mongodb://localhost:27017/apollo')
  .then(() => {
    console.log('mongoose started')
    server.listen(port, () => {
      console.log(`connected to server on port ${port}`)
    });
  });

