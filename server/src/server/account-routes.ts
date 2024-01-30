import { Express } from 'express';
import { addAccountToDB, updateAccount } from '../database';
import { AccountModel, IAccount } from '../database/models/accounts';
import { apolloInitSignup, scraper } from '../scraper/scraper';
import { apolloLoginManuallyAndGetCookies, logIntoApollo, signupForApollo } from '../scraper';
import { getBrowserCookies, waitForNavigationTo } from '../scraper/util';
import { apolloOutlookLogin, apolloOutlookSignup } from '../scraper/outlook';
import { getDomain } from '../helpers';
import { apolloGetCreditsInfo } from '../scraper/apollo';

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
  
      if (save !== null) throw new Error("Failed to add account, account already exists");
  
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

  // (fix) make sure body is corrct format and do error checks and dont use findOne
  app.put('/account/:id', async (req, res) => {
    console.log('updateAccount')
    try {
      const accountID: string = req.body._id 
      if (!accountID) throw new Error('Failed to update account, invalid body')

      const updatedAccount = updateAccount(accountID, req.body);
      if (!updateAccount) throw new Error('Failed to update account')

      
      res.json({ok: true, message: null, data: updatedAccount});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  })

  // should only works with gmail & outlook auth logins
  app.get('/account/login/m/:id', async (req, res) => {
    console.log('login automatically')
    const accountID = req.params.id

    try{
      if (!accountID) throw new Error('Failed to start demining, invalid request body');

      if (!scraper.browser()) {
        await scraper.launchBrowser()
      }

      const account = await AccountModel.findById(accountID)
      if (!account) throw new Error("Failed to start demining, couldn't find account")
    
      await logIntoApollo(account)
      const updatedAccount = await waitForNavigationTo('settings/account')
        .then(async () => {
          const cookies = await getBrowserCookies()
          return await updateAccount(accountID, {cookie: JSON.stringify(cookies)})
        })


      // const updatedAcc  = await apolloLoginManuallyAndGetCookies(req.body.account)
      //   .then(async (cookie) => {
      //     if (cookie) {

      //       const parsedCookie = JSON.stringify(cookie)
      //       const newAccount = await updateAccount(accountID, {cookie: parsedCookie})
        
      //       if (!newAccount) throw new Error('Failed to login (save cookies)');
        
      //       return newAccount
            
      //     } else {
      //       throw new Error('Failed to login automatically (cookies)')
      //     }
      //   })

      scraper.close()
      res.json({ok: true, message: null, data: updatedAccount});
    } catch (err: any) {
      scraper.close()
      res.json({ok: false, message: err.message, data: err});
    }
  })


  app.get('/account/demine/:id', async (req, res) => {
    console.log('demining')
    const accountID = req.params.id

    try{
      if (!accountID) throw new Error('Failed to start demining, invalid request body');

      if (!scraper.browser()) {
        await scraper.launchBrowser()
      }

      const account = await AccountModel.findById(accountID)
      if (!account) throw new Error("Failed to start demining, couldn't find account")
    
      await logIntoApollo(account)
      const updatedAccount = await waitForNavigationTo('settings/account')
        .then(async () => {
          const cookies = await getBrowserCookies()
          return await updateAccount(accountID, {cookie: JSON.stringify(cookies)})
        })


      // const updatedAcc  = await apolloLoginManuallyAndGetCookies(req.body.account)
      //   .then(async (cookie) => {
      //     if (cookie) {

      //       const parsedCookie = JSON.stringify(cookie)
      //       const newAccount = await updateAccount(accountID, {cookie: parsedCookie})
        
      //       if (!newAccount) throw new Error('Failed to login (save cookies)');
        
      //       return newAccount
            
      //     } else {
      //       throw new Error('Failed to login automatically (cookies)')
      //     }
      //   })

      scraper.close()
      res.json({ok: true, message: null, data: updatedAccount});
    } catch (err: any) {
      scraper.close()
      res.json({ok: false, message: err.message, data: err});
    }
  })

  app.get('account/login/a/:id', async (req, res) => {
    console.log('login automatically')
    const accountID = req.params.id

    try {
      if (!accountID) throw new Error('Failed to login, invalid id')

      if (!scraper.browser()) {
        await scraper.launchBrowser()
      }

      const account = await AccountModel.findById(accountID).lean()
      if (!account) throw new Error('Failed to login, cannot find account')

      await logIntoApollo(account)
      const cookies = await getBrowserCookies()
      await updateAccount(accountID, {cookie: JSON.stringify(cookies)})

      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: null});
    }

  })

  app.delete('/account/:id', async (req, res) => {
    const accountID = req.params.id

    try {
      if (!accountID) throw new Error('Failed to delete account, please provide valid id')

      await AccountModel.deleteOne({_id: accountID}).lean()

      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: null});
    }
  })

  app.get('/account/check/:id', async (req, res) => {

    try {
      const accountID = req.params.id
      if (!accountID) throw new Error('Failed to check account, please provide valid id');

      const account = await AccountModel.findById(accountID).lean();
      if (!account) throw new Error('Failed to find account');

      const creditInfo = await apolloGetCreditsInfo(account);

      const upAcc = await updateAccount(accountID, creditInfo);

      res.json({ok: true, message: null, data: upAcc});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: null});
    } 
  })

  // (FIX): make it work with batch (array of ID's in body and loop throught) (use websockets to notify when one completes and on to next)
  app.get('account/upgrade/a/:id', async (req, res) => {
    try {
      const accountID = req.params.id
      if (!accountID) throw new Error('Failed to check account, please provide valid id');

      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: null});
    } 
  })

  app.get('account/upgrade/m/:id', async (req, res) => {
    try {
      const accountID = req.params.id
      if (!accountID) throw new Error('Failed to check account, please provide valid id');

      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: null});
    } 
  })

  app.get('account/mine/:id', async (req, res) => {
    try {
      const accountID = req.params.id
      if (!accountID) throw new Error('Failed to check account, please provide valid id');

      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: null});
    } 
  })

}