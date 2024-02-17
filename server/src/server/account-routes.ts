import { Express } from 'express';
import { addAccountToDB, updateAccount } from '../database';
import { AccountModel, IAccount } from '../database/models/accounts';
import { scraper } from '../scraper/scraper';
import { 
  apolloConfirmAccountEvent, 
  completeApolloAccountConfimation, 
  logIntoApollo, 
  logIntoApolloAndGetCreditsInfo, 
  logIntoApolloAndUpgradeAccount, 
  logIntoApolloAndUpgradeAccountManually, 
  manuallyLogIntoApollo, 
  signupForApollo 
} from '../scraper';
import { getBrowserCookies, logIntoApolloThenVisit, waitForNavigationTo } from '../scraper/util';
import { getDomain } from '../helpers';
import { apolloGetCreditsInfo } from '../scraper/apollo';
import { taskQueue } from '../task_queue';
import { ImapFlowOptions } from 'imapflow';
import { mailbox } from '../mailbox';
import generator from 'generate-password';
import { generateSlug } from 'random-word-slugs';
import { DomainModel } from '../database/models/domain';
import { forwarder } from '../forwarder';

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
          apolloPassword: generator.generate({
            length: 15,
            numbers: true
          })
        }

        // (FIX) better error handling (show user correct error)
        await mailbox.getConnection({
          auth: {
            user: account.email,
            pass: account.password
          }
        } as ImapFlowOptions
        , 
          async (args) => {
            await apolloConfirmAccountEvent(args)
              .then(() => {
                mailbox.relinquishConnection(args.authEmail)
              })
              .catch(() => {
                console.log('failed to confirm apollo account')
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
          recoveryEmail: recoveryEmail || undefined,
        }
        const accountExists = ['gmail', 'outlook', 'hotmail'].includes(getDomain(domainEmail))
          ? await AccountModel.findOne({email}).lean()
          : await AccountModel.findOne({domainEmail}).lean()

        if (accountExists) throw new Error('Failed to create new account, account already exists')
      }

      // (FIX) make it work with taskqueue
      await scraper.launchBrowser()

      await signupForApollo(account)

      // (FIX) indicate that account exists on db but not verified via email or apollo
      await AccountModel.create(account);

      await scraper.close()
      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      await scraper.close()
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
    console.log('login manually')
    const accountID = req.params.id

    try{
      if (!accountID) throw new Error('Failed to start demining, invalid request body');

      const account = await AccountModel.findById(accountID)
      if (!account) throw new Error("Failed to start demining, couldn't find account")
      if (account.domain === 'default') throw new Error('Failed to start manual login, invalid email')

      
      await scraper.launchBrowser()
      
    
      await manuallyLogIntoApollo(account)
      await waitForNavigationTo('/settings/account', 'settings page')
        .then(async () => {
          const cookies = await getBrowserCookies()
          return await updateAccount({_id: accountID}, {cookie: JSON.stringify(cookies)})
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

      
      await scraper.launchBrowser()
      

      const account = await AccountModel.findById(accountID)
      if (!account) throw new Error("Failed to start demining, couldn't find account")
    
      await logIntoApollo(account)
      const updatedAccount = await waitForNavigationTo('settings/account')
        .then(async () => {
          const cookies = await getBrowserCookies()
          return await updateAccount({_id: accountID}, {cookie: JSON.stringify(cookies)})
        })

      await scraper.close()
      res.json({ok: true, message: null, data: updatedAccount});
    } catch (err: any) {
      await scraper.close()
      res.json({ok: false, message: err.message, data: err});
    }
  })

  app.get('/account/login/a/:id', async (req, res) => {
    console.log('login automatically')
    const accountID = req.params.id

    try {
      if (!accountID) throw new Error('Failed to login, invalid id')

      await scraper.launchBrowser()

      const account = await AccountModel.findById(accountID).lean()
      if (!account) throw new Error('Failed to login, cannot find account')

      await logIntoApollo(account)
      const cookies = await getBrowserCookies()
      await updateAccount({_id: accountID}, {cookie: JSON.stringify(cookies)})

      await scraper.close()
      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      await scraper.close()
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

      
      await scraper.launchBrowser()
      

      const creditsInfo = await logIntoApolloAndGetCreditsInfo(account)
      console.log(creditsInfo)
      const updatedAccount = await updateAccount({_id: accountID}, creditsInfo);

      await scraper.close()
      res.json({ok: true, message: null, data: updatedAccount});
    } catch (err: any) {
      await scraper.close()
      res.json({ok: false, message: err.message, data: null});
    } 
  })

  // (FIX): make it work with batch (array of ID's in body and loop throught) (use websockets to notify when one completes and on to next)
  // (FIX): logIntoApolloAndUpgradeAccount should return CreditsInfo type (page layout after upgrade is defferent)
  app.get('/account/upgrade/a/:id', async (req, res) => {
    try {
      const accountID = req.params.id
      if (!accountID) throw new Error('Failed to check account, please provide valid id');

      const account = await AccountModel.findById(accountID).lean();
      if (!account) throw new Error('Failed to find account');

      
      await scraper.launchBrowser()
      


      await logIntoApolloAndUpgradeAccount(account)
      const creditsInfo = await logIntoApolloAndGetCreditsInfo(account)
      const updatedAccount = await updateAccount({_id: accountID}, creditsInfo); // (FIX)

      await scraper.close()
      res.json({ok: true, message: null, data: updatedAccount});
    } catch (err: any) {
      await scraper.close()
      res.json({ok: false, message: err.message, data: null});
    } 
  })

  app.get('/account/upgrade/m/:id', async (req, res) => {
    try {
      const accountID = req.params.id
      if (!accountID) throw new Error('Failed to check account, please provide valid id');

      const account = await AccountModel.findById(accountID).lean();
      if (!account) throw new Error('Failed to find account');

      
      await scraper.launchBrowser()
      

      await logIntoApolloAndUpgradeAccountManually(account)
      const creditsInfo = await logIntoApolloAndGetCreditsInfo(account)
      const updatedAccount = await updateAccount({_id: accountID}, creditsInfo); // (FIX)

      await scraper.close()
      res.json({ok: true, message: null, data: updatedAccount});
    } catch (err: any) {
      await scraper.close()
      res.json({ok: false, message: err.message, data: null});
    } 
  })

  app.get('/account/confirm/:id', async (req, res) => {
    try{
      const accountID = req.params.id
      if (!accountID) throw new Error('Failed to check account, please provide valid id');

      const account = await AccountModel.findById(accountID).lean();
      if (!account) throw new Error('Failed to find account');
      if (account.verified) throw new Error('Request Failed, account is already verified')

      await scraper.launchBrowser()
      
      const newAccount = await completeApolloAccountConfimation(account);
      if (!newAccount) throw new Error('Failed to confirm account, could not complete the process')
    
      await scraper.close()
      res.json({ok: true, message: null, data: newAccount});
    } catch (err: any) {
      await scraper.close()
      res.json({ok: false, message: err.message, data: null});
    }
  })
}





    // try {
    //   // if (!req.body.account) throw new Error('please provide account')
    //   const email = req.body.email;
    //   const password = req.body.password;
    //   const recoveryEmail = req.body.recoveryEmail;
    //   const domainEmail = req.body.domainEmail || email ;
    //   const domain = getDomain(domainEmail);

    //   if (!email || !password) {
    //     throw new Error('invalid request params')
    //   }
    
    //   const account: Partial<IAccount> = {
    //     domain,
    //     domainEmail,
    //     email,
    //     password,
    //     recoveryEmail: recoveryEmail || undefined,
    //     apolloPassword: generator.generate({
    //       length: 15,
    //       numbers: true
    //     }) || 'wearetheworld1233'
    //   }

    //   taskQueue.enqueue({
    //     id: generateSlug(),
    //     action: async (account: IAccount) => {

    //       console.log(AccountModel)

    //       const accountExists = !['gmail', 'outlook', 'hotmail'].includes(account.domainEmail)
    //         ? await AccountModel.findOne({domainEmail: account.domainEmail}).lean()
    //         : await AccountModel.findOne({email: account.email}).lean();

    //       if (accountExists) throw new Error('Failed to create new account, account already exists')

    //       // (FIX) better error handling (show user correct error)
    //       await mailbox.newConnection({
    //         auth: {
    //           user: account.email,
    //           pass: account.password
    //         }
    //       } as ImapFlowOptions, 
    //       newMailEvent
    //         .then(async () => {
    //           console.log(`
              
    //             THE CALLBACK WORKS
              
    //           `)
    //           const cookie = await getBrowserCookies()
    //           await updateAccount({email: account.email}, {cookie: JSON.stringify(cookie)})
    //         })
    //       )
  
    //       // (FIX) make it work with taskqueue
    //       if (!scraper.browser()) await scraper.launchBrowser()
  
    //       await signupForApollo(account)
  
    //       // (FIX) indicate that account exists on db but not verified via email or apollo
    //       await AccountModel.create(account);
    //     },
    //     args: account as IAccount
    //   })