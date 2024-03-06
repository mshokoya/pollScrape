import { Express } from 'express';
import { updateAccount } from '../database';
import { AccountModel, IAccount } from '../database/models/accounts';
import { scraper } from '../scraper/apollo/scraper';
import { 
  apolloConfirmAccountEvent, 
  completeApolloAccountConfimation, 
  logIntoApollo, 
  logIntoApolloAndGetCreditsInfo, 
  logIntoApolloAndUpgradeAccount, 
  logIntoApolloAndUpgradeAccountManually, 
  manuallyLogIntoApollo, 
  signupForApollo 
} from '../scraper/apollo';
import { getBrowserCookies, logIntoApolloThenVisit, waitForNavigationTo } from '../scraper/apollo/util';
import { AppError, generateID, getDomain } from '../util';
// import { apolloGetCreditsInfo } from '../scraper/apollo';
import { taskQueue } from '../task_queue';
import { MailboxAuthOptions, mailbox } from '../mailbox';
import { generateSlug } from 'random-word-slugs';
import { DomainModel } from '../database/models/domain';
import { io } from '../websockets';

export const accountRoutes = (app: Express) => {
  // (FIX) test it works with db
  // (FIX) allow account overwrite. in  addAccountToDB use upsert
  app.post('/account', async (req, res) => {
    console.log('addAccount')

    try{
      const selectedDomain = req.body.selectedDomain
      const addType = req.body.addType
      const email = req.body.email;
      const password = req.body.password;
      const recoveryEmail = req.body.recoveryEmail;
      const domainEmail = req.body.domainEmail || email ;
      const domain = getDomain(domainEmail);
      let account: Partial<IAccount>;
      const taskID = generateID()

      if (!addType) throw new Error('Failed to add account, invalid request params')

      if (addType === 'domain') {
        if (!selectedDomain) throw new Error('Failed to add account, domain not provided')
        const d = await DomainModel.findOne({domain: selectedDomain}).lean()
        if (!d) throw new Error('Failed to add account, domain could not be found')
      
        account = {
          // (FIX) make sure it does not try to use domain email that already exists
          domainEmail: `${generateSlug(3)}@${selectedDomain}`,
          domain: selectedDomain,
          email: d.authEmail,
          password: d.authPassword,
          apolloPassword: generateID()
        }

        // (FIX) better error handling (show user correct error)
        await mailbox.getConnection({
          auth: {
            user: account.email,
            pass: account.password
          },
          aliasEmail: account.domainEmail
        } as MailboxAuthOptions
        , 
          async (args) => {
            await apolloConfirmAccountEvent(taskID, args)
              .then(() => {
                console.log('signup complete')
              })
              .catch(() => {
                console.log('failed to confirm apollo account')
              })
              .finally(() => {
                mailbox.relinquishConnection(args.authEmail)
              })
              
          }
        )

      } else {
        if (!email || !password) throw new Error('invalid request params')

        account = {
          domain,
          domainEmail,
          email,
          password,
          recoveryEmail,
        }
        
        const accountExists = ['gmail', 'outlook', 'hotmail'].includes(getDomain(domainEmail))
          ? await AccountModel.findOne({email}).lean()
          : await AccountModel.findOne({domainEmail}).lean()

        if (accountExists) throw new Error('Failed to create new account, account already exists')
      }

      await taskQueue.enqueue(
        taskID,
        'apollo',
        'create',
        `adding ${account.domainEmail}`,
        {domainEmail: account.domainEmail},
        async () => {
          io.emit(
            'apollo', 
            { 
              taskID, 
              taskType: 'create',
              message: `adding ${account.domainEmail}`,
            }
          );
          const browserCTX = await scraper.newBrowser(false)
          if (!browserCTX) throw new AppError(taskID, 'Failed to confirm account, browser could not be started')
          try {
            
            await signupForApollo(taskID, browserCTX, account)
            // (FIX) indicate that account exists on db but not verified via email or apollo
            return await AccountModel.create(account);
          } finally {
            await scraper.close(browserCTX)
          }
        }
      )

      res.json({ok: true, message: null, data: null});
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

  // (fix) make sure body is corrct format and do error checks and dont use findOne
  app.put('/account/:id', async (req, res) => {
    console.log('updateAccount')
    try {
      const accountID: string = req.body._id 
      if (!accountID) throw new Error('Failed to update account, invalid body')

      const updatedAccount = await updateAccount({_id: accountID}, req.body);
      if (!updateAccount) throw new Error('Failed to update account')

      res.json({ok: true, message: null, data: updatedAccount});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  })

  // (FIX): should only works with gmail & outlook auth logins
  // (FIX): check if waitForNavigationTo func can get cookies after browser closed
  app.get('/account/login/m/:id', async (req, res) => {
    console.log('loginManually')
    try{
      const accountID = req.params.id
      if (!accountID) throw new Error('Failed to start demining, invalid request body');

      const account = await AccountModel.findById(accountID)
      if (!account) throw new Error("Failed to start demining, couldn't find account")
      if (account.domain === 'default') throw new Error('Failed to start manual login, invalid email')

      const taskID = generateID()
      await taskQueue.enqueue(
        taskID,
        'apollo',
        'manualLogin',
        `Login into ${account.domainEmail}`,
        {accountID},
        async () => {
          io.emit(
            'apollo', 
            { 
              taskID, 
              taskType: 'manualLogin',
              message: `Login into ${account.domainEmail}`,
              data: {accountID}
            }
          );
          const browserCTX = await scraper.newBrowser(false)
          if (!browserCTX) throw new AppError(taskID, 'Failed to confirm account, browser could not be started')
          try {
            await manuallyLogIntoApollo(taskID, browserCTX, account)
            await waitForNavigationTo(browserCTX, '/settings/account', 'settings page')
              .then(async () => {
                const cookies = await getBrowserCookies(browserCTX)
                return await updateAccount({_id: accountID}, {cookie: JSON.stringify(cookies)})
              })
          } finally {
            await scraper.close(browserCTX)
          }
        }
      )

      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  })


  app.get('/account/demine/:id', async (req, res) => {
    console.log('mines')
    try{
      const accountID = req.params.id
      if (!accountID) throw new Error('Failed to start demining, invalid request body');

      const account = await AccountModel.findById(accountID)
      if (!account) throw new Error("Failed to start demining, couldn't find account")

      const taskID = generateID()
      await taskQueue.enqueue(
        taskID,
        'apollo',
        'demine',
        `Demine ${account.domainEmail} popups`,
        {accountID},
        async () => {
          io.emit(
            'apollo', 
            { 
              taskID, 
              taskType: 'demine',
              message: `Demine ${account.domainEmail} popups`,
              data: {accountID}
            }
          );
          const browserCTX = await scraper.newBrowser(false)
          if (!browserCTX) throw new AppError(taskID, 'Failed to confirm account, browser could not be started')
          try {
            if (account.cookie) browserCTX.page.setCookie(JSON.parse(account.cookie))
            await logIntoApollo(taskID, browserCTX, account)
            await waitForNavigationTo(browserCTX, 'settings/account')
              .then(async () => {
                const cookies = await getBrowserCookies(browserCTX)
                return await updateAccount({_id: accountID}, {cookie: JSON.stringify(cookies)})
              })
          } finally {
            await scraper.close(browserCTX)
          }
        } 
      )

      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  })

  app.get('/account/login/a/:id', async (req, res) => {
    console.log('loginauto')
    try {
      const accountID = req.params.id
      if (!accountID) throw new Error('Failed to login, invalid id')

      const account = await AccountModel.findById(accountID).lean()
      if (!account) throw new Error('Failed to login, cannot find account')

      const taskID = generateID()
      taskQueue.enqueue(
        taskID,
        'apollo',
        'login',
        `Logging into ${account.domainEmail} apollo account`,
        {accountID},
        async () => {
          io.emit(
            'apollo', 
            { 
              taskID, 
              taskType: 'login',
              message: `Logging into ${account.domainEmail} apollo account`,
              data: {accountID}
            }
          );
          const browserCTX = await scraper.newBrowser(false)
          if (!browserCTX) throw new AppError(taskID, 'Failed to confirm account, browser could not be started')
          try {
            io.emit('apollo', {taskID, message: "attempting to login"})
            await logIntoApollo(taskID, browserCTX, account)
              .then(() => { io.emit('apollo', {taskID, message: "login complete"}) })
            
            io.emit('apollo', {taskID, message: "attempting to update browser cookies in db"})
            const cookies = await getBrowserCookies(browserCTX)
              .then(() => { io.emit('apollo', {taskID, message: "collected browser cookies"}) })
            
            io.emit('apollo', {taskID, message: "saving browser cookies in db"})
            await updateAccount({_id: accountID}, {cookie: JSON.stringify(cookies)})
          } finally {
            await scraper.close(browserCTX)
          }
        }
      )

      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: null});
    }
  })

  app.delete('/account/:id', async (req, res) => {
    console.log('deleteAccounts')
    try {
      const accountID = req.params.id
      if (!accountID) throw new Error('Failed to delete account, please provide valid id')

      await AccountModel.deleteOne({_id: accountID}).lean()

      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: null});
    }
  })

  app.get('/account/check/:id', async (req, res) => {
    console.log('checkAccounts')
    try {
      const accountID = req.params.id
      if (!accountID) throw new Error('Failed to check account, please provide valid id');

      const account = await AccountModel.findById(accountID).lean();
      if (!account) throw new Error('Failed to find account');

      const taskID = generateID()
      taskQueue.enqueue(
        taskID,
        'apollo',
        'check',
        `Getting information on ${account.domainEmail} credits`,
        {accountID},
        async () => {
          io.emit(
            'apollo', 
            { 
              taskID, 
              taskType: 'check',
              message: `Getting information on ${account.domainEmail} credits`,
              data: {accountID}
            }
          );
          const browserCTX = await scraper.newBrowser(false)
          if (!browserCTX) throw new AppError(taskID, 'Failed to confirm account, browser could not be started')
          try {
            if (account.cookie) browserCTX.page.setCookie(JSON.parse(account.cookie))
            const creditsInfo = await logIntoApolloAndGetCreditsInfo(taskID, browserCTX, account)
            return await updateAccount({_id: accountID}, creditsInfo);
          } finally {
            await scraper.close(browserCTX)
          }
        }
      )

      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: null});
    } 
  })

  // (FIX): make it work with batch (array of ID's in body and loop throught) (use websockets to notify when one completes and on to next)
  // (FIX): logIntoApolloAndUpgradeAccount should return CreditsInfo type (page layout after upgrade is defferent)
  app.get('/account/upgrade/a/:id', async (req, res) => {
    console.log('upgradeAccounts')
    try {
      const accountID = req.params.id
      if (!accountID) throw new Error('Failed to check account, please provide valid id');

      const account = await AccountModel.findById(accountID).lean();
      if (!account) throw new Error('Failed to find account');

      const taskID = generateID()
      taskQueue.enqueue(
        taskID,
        'apollo',
        'upgrade',
        `Upgrading ${account.domainEmail} automatically`,
        {accountID},
        async () => {
          io.emit(
            'apollo', 
            { 
              taskID, 
              taskType: 'upgrade',
              message: `Upgrading ${account.domainEmail} automatically`,
              data: {accountID}
            }
          );
          const browserCTX = await scraper.newBrowser(false)
          if (!browserCTX) throw new AppError(taskID, 'Failed to confirm account, browser could not be started')
          try {
            if (account.cookie) browserCTX.page.setCookie(JSON.parse(account.cookie))
            await logIntoApolloAndUpgradeAccount(taskID, browserCTX, account)
            const creditsInfo = await logIntoApolloAndGetCreditsInfo(taskID, browserCTX, account)
            return await updateAccount({_id: accountID}, creditsInfo); // (FIX)
          } finally {
            await scraper.close(browserCTX)
          }
        }
      )

      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: null});
    } 
  })

  // (FIX) check implimentation is correct...
  app.get('/account/upgrade/m/:id', async (req, res) => {
    console.log('upgradeAccountManual')
    try {
      const accountID = req.params.id
      if (!accountID) throw new Error('Failed to check account, please provide valid id');

      const account = await AccountModel.findById(accountID).lean();
      if (!account) throw new Error('Failed to find account');

      const taskID = generateID()
      taskQueue.enqueue(
        taskID,
        'apollo',
        'manualUpgrade',
        `Upgrading ${account.domainEmail} manually`,
        {accountID},
        async () => {
          io.emit(
            'apollo', 
            { 
              taskID, 
              taskType: 'manualUpgrade', 
              message: `Upgrading ${account.domainEmail} manually`,
              data: {accountID}
            }
          );
          const browserCTX = await scraper.newBrowser(false)
          if (!browserCTX) throw new AppError(taskID, 'Failed to confirm account, browser could not be started')
          try {
            if (account.cookie) browserCTX.page.setCookie(JSON.parse(account.cookie))
            await logIntoApolloAndUpgradeAccountManually(taskID, browserCTX, account)
            const creditsInfo = await logIntoApolloAndGetCreditsInfo(taskID, browserCTX, account)
            return await updateAccount({_id: accountID}, creditsInfo); // (FIX)
          } finally {
            await scraper.close(browserCTX)
          }
        }
      )

      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: null});
    } 
  })

  app.get('/account/confirm/:id', async (req, res) => {
    console.log('confirm')
    const taskID = generateID()

    try{
      const accountID = req.params.id
      if (!accountID) throw new Error('Failed to check account, please provide valid id');

      const account = await AccountModel.findById(accountID).lean();
      if (!account) throw new Error('Failed to find account');
      if (account.verified) throw new Error('Request Failed, account is already verified');

      
      taskQueue.enqueue(
        taskID,
        'apollo',
        'confirm',
        `confirming account ${account.domainEmail}`,
        {accountID},
        async () => {
          io.emit(
            'apollo', 
            { 
              taskID, 
              taskType: 'confirm', 
              message: `confirming account ${account.domainEmail}`, 
              data: {accountID}
            }
          );
          const browserCTX  = await scraper.newBrowser(false)
          if (!browserCTX) throw new AppError(taskID, 'Failed to confirm account, browser could not be started')
          try {
            if (account.cookie) browserCTX.page.setCookie(JSON.parse(account.cookie))
            const newAccount = await completeApolloAccountConfimation(taskID, browserCTX, account);
            if (!newAccount) throw new AppError(taskID, 'Failed to confirm account, could not complete the process');
            return newAccount
          } finally {
            await scraper.close(browserCTX)
          }
        }
      )

      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: null});
    }
  })
}