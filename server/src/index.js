import express from 'express';
import mongoose from 'mongoose';
import {createServer} from 'node:http';
import {startScrapingApollo} from './scraper';
// import {socketIO} from './webSockets';
import {addAccountToDB, addProxyToDB} from './db';

const app = express();
const server = createServer();
const port = 4000;

//  free proxies
// https://proxyscrape.com/free-proxy-list


app.use(express.json());

app.post('/adduser', async (req, res) => {
  try {
    await addAccountToDB(req.body.email, req.body.password)
    res.json({ok: true, message: null, data: null})
  } catch (err) {
    res.json({ok: false, message: 'failed to add user', data: err})
  }
});

app.post('/addproxy', async (req, res) => {
  try {
    await addProxyToDB(req.body.proxy)
    res.json({ok: true, message: null, data: null})
  } catch (err) {
    res.json({ok: false, message: 'failed to proxy', data: err})
  }
});

app.post('/startscrape', async (req, res) => {
  startScrapingApollo()
  res.json({ok: true,data: {message: "hello world"}})
});

mongoose.connect('mongodb://localhost:27017/apollo')
  .then(() => {
    console.log('mongoose started')
    server.listen(port, () => {
      console.log('connected to server on port 4000')
    })
  })

