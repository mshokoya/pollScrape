import { Express } from 'express';
import { addAccountToDB, addCookiesToAccount } from '../database';
import { AccountModel, IAccount } from '../database/models/accounts';
import { apolloInitSignup, scraper } from '../scraper/scraper';
import { apolloLoginManuallyAndGetCookies, signupForApollo } from '../scraper';
import { getBrowserCookies } from '../scraper/util';
import { apolloOutlookLogin, apolloOutlookSignup } from '../scraper/outlook';

export const accountRoutes = (app: Express) => {

  // (FIX) allow account overwrite. in  addAccountToDB use upsert
  app.post('/account', async (req, res) => {
    console.log('addAccount')

    if (!req.body.account) throw new Error('please provide account')

    const email = req.body.account.email;
    const password = req.body.account.password;
    const loginType = req.body.account.loginType;
    // const recoveryEmail = req.body.account.recoveryEmail;
    // const loginType = 'outlook';

    if (!email || !password || !loginType) {
      throw new Error('invalid request body')
    }

    try {
      if (!scraper.browser()) {
        await scraper.launchBrowser()
      }

      // {email, password, loginType, recoveryEmail: 'poopgame160@gmail.com'}
      await signupForApollo(req.body.account)

      const cookie = await getBrowserCookies()

      const save = await addAccountToDB({
        email, 
        password, 
        loginType, 
        cookie: JSON.stringify(cookie)
      })
  
      if (save !== null) throw new Error("Account already exists");
  
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

