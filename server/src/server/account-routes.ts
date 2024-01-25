import { Express } from 'express';
import { addAccountToDB, addCookiesToAccount } from '../database';
import { AccountModel } from '../database/models/accounts';
import { scraper } from '../scraper/scraper';
import { apolloLoginManuallyAndGetCookies } from '../scraper';
import { getBrowserCookies } from '../scraper/util';
import { logIntoApollo } from '../scraper/apollo';
import { apolloOutlookLogin, apolloOutlookSignup } from '../scraper/outlook';

export const accountRoutes = (app: Express) => {

  // (FIX) allow account overwrite. in  addAccountToDB use upsert
  app.post('/account', async (req, res) => {
    console.log('addAccount')

    const email = req.body.email;
    const password = req.body.password;
    // const loginType = req.body.loginType;
    const loginType = 'outlook';

    if (!email || !password || !loginType) {
      throw new Error('invalid request body')
    }

    try {
      if (!scraper.browser()) {
        await scraper.launchBrowser()
      }

      await apolloOutlookLogin({email, password, loginType})

      const cookie = await getBrowserCookies()

      const save = await addAccountToDB({
        email, 
        password, 
        loginType, 
        cookie: JSON.stringify(cookie)
      })
  
      // if (save !== null) throw new Error("Account already exists");
  
      scraper.close()
      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      if (scraper.browser()) await scraper.close()
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
        { new: true }
      ).lean();
  
      if (update !== null) throw new Error("Failed to update account");
      
      res.json({ok: true, message: null, data: update});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  })

  // (FIX): make reactive
  app.post('/account/cookies', async (req, res) => {
    console.log('loginCookies')

    const account = req.body.account

    try{

      if (!account) throw new Error('invalid request body');

      const updatedAcc  = await apolloLoginManuallyAndGetCookies(req.body.account)
        .then(async (cookie) => {
          if (cookie) {

            const newAccount = await addCookiesToAccount(account._id, cookie)
        
            if (!newAccount) throw new Error('failed to login (save cookies)');
        
            return newAccount
            
          } else {
            throw new Error('failed to login (cookies)')
          }
        })

      res.json({ok: true, message: null, data: updatedAcc});
    } catch (err: any) {
      scraper.close()
      res.json({ok: false, message: err.message, data: err});
    }
  })

}

