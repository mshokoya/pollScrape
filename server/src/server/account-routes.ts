import { Express } from 'express';
import { addAccountToDB, addCookiesToAccount } from '../database';
import { AccountModel, IAccount } from '../database/models/accounts';
import { apolloInitSignup, scraper } from '../scraper/scraper';
import { apolloLoginManuallyAndGetCookies, signupForApollo } from '../scraper';
import { getBrowserCookies } from '../scraper/util';
import { apolloOutlookLogin, apolloOutlookSignup } from '../scraper/outlook';
import { getDomain } from '../helpers';

export const accountRoutes = (app: Express) => {

  // (FIX) allow account overwrite. in  addAccountToDB use upsert
  app.post('/account', async (req, res) => {
    console.log('addAccount')

    if (!req.body.account) throw new Error('please provide account')

    const email = req.body.email;
    const password = req.body.password;
    const recoveryEmail = req.body.recoveryEmail;

    if (!email || !password) {
      throw new Error('invalid request params')
    }

    try {
      if (!scraper.browser()) {
        await scraper.launchBrowser()
      }

      const domain = getDomain(email);

      const account: Partial<IAccount> = {email, password, domain}
      if (recoveryEmail) account.recoveryEmail = recoveryEmail

      await signupForApollo(account)

      const cookie = await getBrowserCookies()

      const save = await addAccountToDB({
        email, 
        password, 
        domain, 
        cookie: JSON.stringify(cookie),
        recoveryEmail
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

      scraper.close()
      res.json({ok: true, message: null, data: updatedAcc});
    } catch (err: any) {
      scraper.close()
      res.json({ok: false, message: err.message, data: err});
    }
  })

  app.delete('/account/:id', async (req, res) => {
    const accountID = req.params.id

    try {
      if (!accountID) throw new Error('failed to delete account, please provide valid id')

      await AccountModel.deleteOne({_id: accountID}).lean()
        .catch(() => {throw new Error('Failed to delete account')})

      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: null});
    }
  })

}