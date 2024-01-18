import { Express } from 'express';
import { addAccountToDB } from '../database';
import { apolloGetCookiesFromLogin } from '../scraper';
import { AccountModel } from '../database/models/accounts';
import { scraper } from '../scraper/scraper';

export const accountRoutes = (app: Express) => {

  app.post('/account', async (req, res) => {
    console.log('addAccount')
    try {
      const save = await addAccountToDB(req.body.email, req.body.password)
  
      if (save !== null) throw new Error("Account already exists");
  
      res.json({ok: true, message: null, data: save});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  })

  app.get('/account', async (_req, res) => {
    console.log('getAccounts')
    try {
      const accounts = await AccountModel.find({}).lean();
      
      res.json({ok: true, message: null, data: accounts});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  })

  app.put('/account', async (req, res) => {
    console.log('updateAccount')
    try {
      const update = await AccountModel.findOneAndUpdate(
        {_id: req.body._id},
        req.body,
        { new: false }
      );
  
      if (update !== null) throw new Error("Failed to update account");
      
      res.json({ok: true, message: null, data: update});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  })

  // (FIX): make reactive
  app.post('/account/cookies', async (req, res) => {
    console.log('loginCookies')
    try{
      const updatedAcc  = await apolloGetCookiesFromLogin(req.body.account)
      res.json({ok: true, message: null, data: updatedAcc});
    } catch (err: any) {
      scraper.close()
      res.json({ok: false, message: err.message, data: err});
    }
  })

}

