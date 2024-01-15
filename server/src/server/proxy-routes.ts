import { Express } from 'express';
import { verifyProxy } from '../database/util';
import { addProxyToDB } from '../database';
import { ProxyModel } from '../database/models/proxy';

export const proxyRoutes = (app: Express) => {

  app.get('/proxy', async (req, res) => {
    try {
      const proxies = await ProxyModel.find({}).lean();
  
      res.json({ok: true, message: null, data: proxies});
    } catch (err) {
      res.json({ok: false, message: 'failed to proxy', data: err});
    }
  });

  app.post('/addproxy', async (req, res) => {
    console.log('addproxy')
    try {
      const proxyRes = await verifyProxy(req.body.url);
      
      if (proxyRes.valid) {
        await addProxyToDB(req.body.proxy);
      }
  
      res.json({ok: true, message: null, data: null});
    } catch (err) {
      res.json({ok: false, message: 'failed to proxy', data: err});
    }
  });

}

