import { Express } from 'express';
import { addAccountToDB, updateAccount } from '../database';
import { AccountModel, IAccount } from '../database/models/accounts';
import { scraper } from '../scraper/scraper';
import { logIntoApollo, logIntoApolloAndGetCreditsInfo, logIntoApolloAndUpgradeAccount, logIntoApolloAndUpgradeAccountManually, manuallyLogIntoApollo, signupForApollo } from '../scraper';
import { getBrowserCookies, logIntoApolloThenVisit, waitForNavigationTo } from '../scraper/util';
import { getDomain } from '../helpers';
import { apolloGetCreditsInfo } from '../scraper/apollo';
import { taskQueue } from '../task_queue';

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
  
      await scraper.close()
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

  // (FIX): should only works with gmail & outlook auth logins
  // (FIX): check if waitForNavigationTo func can get cookies after browser closed
  app.get('/account/login/m/:id', async (req, res) => {
    console.log('login manually')
    const accountID = req.params.id

    try{
      if (!accountID) throw new Error('Failed to start demining, invalid request body');

      const account = await AccountModel.findById(accountID)
      if (!account) throw new Error("Failed to start demining, couldn't find account")
      if (account.domain === 'default') throw new Error('Failed to start manual login, invalid email')

      if (!scraper.browser()) {
        await scraper.launchBrowser()
      }
    
      await manuallyLogIntoApollo(account)
      await waitForNavigationTo('/settings/account', 'settings page')
        .then(async () => {
          const cookies = await getBrowserCookies()
          return await updateAccount(accountID, {cookie: JSON.stringify(cookies)})
        })

      await scraper.close()
      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      await scraper.close()
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

      await scraper.close()
      res.json({ok: true, message: null, data: updatedAccount});
    } catch (err: any) {
      await scraper.close()
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

      await scraper.close();
      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      await scraper.close();
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

      if (!scraper.browser()) {
        await scraper.launchBrowser()
      }

      const creditsInfo = await logIntoApolloAndGetCreditsInfo(account)
      const updatedAccount = await updateAccount(accountID, creditsInfo);

      await scraper.close()
      res.json({ok: true, message: null, data: updatedAccount});
    } catch (err: any) {
      await scraper.close()
      res.json({ok: false, message: err.message, data: null});
    } 
  })

  // (FIX): make it work with batch (array of ID's in body and loop throught) (use websockets to notify when one completes and on to next)
  // (FIX): logIntoApolloAndUpgradeAccount should return CreditsInfo type (page layout after upgrade is defferent)
  app.get('account/upgrade/a/:id', async (req, res) => {
    try {
      const accountID = req.params.id
      if (!accountID) throw new Error('Failed to check account, please provide valid id');

      const account = await AccountModel.findById(accountID).lean();
      if (!account) throw new Error('Failed to find account');

      if (!scraper.browser()) {
        await scraper.launchBrowser()
      }


      await logIntoApolloAndUpgradeAccount(account)
      const creditsInfo = await logIntoApolloAndGetCreditsInfo(account)
      const updatedAccount = await updateAccount(accountID, creditsInfo); // (FIX)

      await scraper.close()
      res.json({ok: true, message: null, data: updatedAccount});
    } catch (err: any) {
      await scraper.close()
      res.json({ok: false, message: err.message, data: null});
    } 
  })

  app.get('account/upgrade/m/:id', async (req, res) => {
    try {
      const accountID = req.params.id
      if (!accountID) throw new Error('Failed to check account, please provide valid id');

      const account = await AccountModel.findById(accountID).lean();
      if (!account) throw new Error('Failed to find account');

      if (!scraper.browser()) {
        await scraper.launchBrowser()
      }

      await logIntoApolloAndUpgradeAccountManually(account)
      const creditsInfo = await logIntoApolloAndGetCreditsInfo(account)
      const updatedAccount = await updateAccount(accountID, creditsInfo); // (FIX)

      await scraper.close()
      res.json({ok: true, message: null, data: updatedAccount});
    } catch (err: any) {
      await scraper.close()
      res.json({ok: false, message: err.message, data: null});
    } 
  })
}