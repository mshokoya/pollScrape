import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import {createServer} from 'node:http';
import {startScrapingApollo} from './scraper';
// import {socketIO} from './webSockets';
import { AccountModel } from './db/database'; 
import {addAccountToDB, addProxyToDB} from './db';
import { verifyProxy } from './db/util';

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
    // await addAccountToDB(req.body.email, req.body.password)
    res.json({ok: true, message: null, data: null})
  } catch (err) {
    res.json({ok: false, message: 'failed to add user', data: err})
  }
});

app.post('/account', async (req, res) => {
  console.log('addAccount')
  try {
    const data = {'apollo.email': req.body.email, 'apollo.password': req.body.password}
    const save = await AccountModel.findOneAndUpdate(
      data,
      { $setOnInsert: data },
      { upsert: true, new: false }
    )

    if (save !== null) throw new Error("Account already exists");

    res.json({ok: true, message: null, data: save})
  } catch (err) {
    res.json({ok: false, message: 'failed to add user', data: err})
  }
})

app.get('/account', async (_req, res) => {
  console.log('getAccounts')
  try {

    const accounts = await AccountModel.find({}).lean()
    
    res.json({ok: true, message: null, data: accounts})
  } catch (err) {
    res.json({ok: false, message: 'failed to get user', data: err})
  }
})

app.put('/account', async (req, res) => {
  try {
    const update = await AccountModel.findOneAndUpdate(
      {_id: req.body._id},
      req.body,
      { new: false }
    )

    if (update !== null) throw new Error("Failed to update");
    
    res.json({ok: true, message: null, data: update})
  } catch (err) {
    res.json({ok: false, message: 'failed to add user', data: err})
  }
})

app.post('/addproxy', async (req, res) => {
  try {
    const verify = await verifyProxy(req.body.url)
    
    // await addProxyToDB(req.body.proxy)
    // res.status(200)
    res.json({ok: true, message: "Proxy Verified", data: verify})
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

