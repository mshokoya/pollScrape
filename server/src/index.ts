import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import {createServer} from 'node:http';
import {startScrapingApollo} from './scraper';
// import {socketIO} from './webSockets';
import {addAccountToDB, addProxyToDB} from './db';

const app = express();
const server = createServer(app);
const port = 4000;

//  free proxies
// https://proxyscrape.com/free-proxy-list
// https://geonode.com/free-proxy-list

app.use(cors());
app.use(bodyParser.json());

app.post('/addaccount', async (req, res) => {
  console.log('addAccount')
  try {
    await addAccountToDB(req.body.email, req.body.password)
    res.json({ok: true, message: null, data: null})
  } catch (err) {
    res.json({ok: false, message: 'failed to add user', data: err})
  }
});

app.post('/addproxy', async (req, res) => {
  console.log('add proxy')
  console.log(req.body)
  try {
    // await addProxyToDB(req.body.proxy)
    // res.status(200)
    res.json({ok: true, message: null, data: null})
  } catch (err) {
    // res.status(400)
    res.json({ok: false, message: 'failed to proxy', data: err})
  }
});

app.post('/startscrape', async (req, res) => {
  console.log('start scraping')
  startScrapingApollo([req.body.url])
  // startScrapingApollo()
  res.json({ok: true, data: {message: "hello world"}})
});

app.use((err: any, _req: any, res: any, next: any) => {
  if (res.headersSent) {
    return next(err)
  }
  res.status(500)
  res.render('error', { error: err })
})

mongoose.connect('mongodb://localhost:27017/apollo')
  .then(() => {
    console.log('mongoose started')
    server.listen(port, () => {
      console.log(`connected to server on port ${port}`)
    })
  })

