import { Express } from 'express'
import { updateAccount } from '../database'
import { AccountModel, IAccount } from '../database/models/accounts'
import { BrowserContext, scraper } from '../scraper/apollo/scraper'
import {
  apolloConfirmAccountEvent,
  completeApolloAccountConfimation,
  logIntoApollo,
  logIntoApolloAndGetCreditsInfo,
  logIntoApolloAndUpgradeAccount,
  logIntoApolloAndUpgradeAccountManually,
  manuallyLogIntoApollo,
  signupForApollo
} from '../scraper/apollo'
import {
  getBrowserCookies,
  // logIntoApolloThenVisit,
  waitForNavigationTo
} from '../scraper/apollo/util'
import { AppError, generateID, getDomain } from '../util'
// import { apolloGetCreditsInfo } from '../scraper/apollo';
import { taskQueue } from '../task_queue'
import { MailboxAuthOptions, accountToMailbox, mailbox } from '../mailbox'
import { generateSlug } from 'random-word-slugs'
import { DomainModel } from '../database/models/domain'
import { io } from '../websockets'
import { Cluster } from 'puppeteer-cluster'
import { init } from '../start'

export const accountRoutes = (app: Express) => {
  // (FIX) test it works with db
  // (FIX) allow account overwrite. in  addAccountToDB use upsert
  app.post('/account', async (req, res) => {
    res.json(
      await addAccount({
        emaill: req.body.email,
        addTypee: req.body.addType,
        selectedDomainn: req.body.selectedDomain,
        passwordd: req.body.password,
        recoveryEmaill: req.body.recoveryEmail,
        domainEmaill: req.body.domainEmail
      })
    )
  })
  app.get('/account', async (_req, res) => {
    res.json(await getAccounts())
  })
  // (fix) make sure body is corrct format and do error checks and dont use findOne
  app.put('/account/:id', async (req, res) => {
    res.json(await updateAcc(req.body._id, req.body))
  })
  // (FIX): should only works with gmail & outlook auth logins
  // (FIX): check if waitForNavigationTo func can get cookies after browser closed
  app.get('/account/login/m/:id', async (req, res) => {
    res.json(await loginManually(req.params.id))
  })
  app.get('/account/demine/:id', async (req, res) => {
    res.json(await demine(req.params.id))
  })
  app.get('/account/login/a/:id', async (req, res) => {
    res.json(await loginAuto(req.params.id))
  })
  app.delete('/account/:id', async (req, res) => {
    res.json(await deleteAccount(req.params.id))
  })
  app.get('/account/check/:id', async (req, res) => {
    res.json(await checkAccount(req.params.id))
  })
  // (FIX): make it work with batch (array of ID's in body and loop throught) (use websockets to notify when one completes and on to next)
  // (FIX): logIntoApolloAndUpgradeAccount should return CreditsInfo type (page layout after upgrade is defferent)
  app.get('/account/upgrade/a/:id', async (req, res) => {
    res.json(await upgradeAutomatically(req.params.id))
  })
  // (FIX) check implimentation is correct...
  app.get('/account/upgrade/m/:id', async (req, res) => {
    res.json(await upgradeManually(req.params.id))
  })
  app.get('/account/confirm/:id', async (req, res) => {
    res.json(await confirmAccount(req.params.id))
  })
}

export const confirmAccount = async (id: string) => {
  console.log('confirm')
  const taskID = generateID()

  try {
    const accountID = id
    if (!accountID) throw new Error('Failed to check account, please provide valid id')

    const account = await AccountModel.findById(accountID).lean()
    if (!account) throw new Error('Failed to find account')
    // if (account.verified) throw new Error('Request Failed, account is already verified');

    taskQueue.enqueue(
      taskID,
      'apollo',
      'confirm',
      `confirming account ${account.domainEmail}`,
      { accountID },
      async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'confirm',
          message: `confirming account ${account.domainEmail}`,
          data: { accountID }
        })
        try {
          const browserCTX = await scraper.newBrowser(false)
          if (!browserCTX)
            throw new AppError(taskID, 'Failed to confirm account, browser could not be started')

          return (await browserCTX.execute(
            { taskID, account },
            async ({ page, data: { taskID, account } }) => {
              await init()
              const newAccount = await completeApolloAccountConfimation(
                taskID,
                { page } as BrowserContext,
                account
              )
              if (!newAccount)
                throw new AppError(
                  taskID,
                  'Failed to confirm account, could not complete the process'
                )
              return newAccount
            }
          )) as Promise<IAccount>
        } finally {
          await mailbox.relinquishConnection(import.meta.env.MAIN_VITE_AUTHEMAIL)
        }
      }
    )

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const upgradeManually = async (id: string) => {
  console.log('upgradeAccountManual')
  try {
    const accountID = id
    if (!accountID) throw new Error('Failed to check account, please provide valid id')

    const account = await AccountModel.findById(accountID).lean()
    if (!account) throw new Error('Failed to find account')

    const taskID = generateID()
    taskQueue.enqueue(
      taskID,
      'apollo',
      'manualUpgrade',
      `Upgrading ${account.domainEmail} manually`,
      { accountID },
      async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'manualUpgrade',
          message: `Upgrading ${account.domainEmail} manually`,
          data: { accountID }
        })

        try {
          const browserCTX = await scraper.newBrowser(false)
          if (!browserCTX)
            throw new AppError(taskID, 'Failed to confirm account, browser could not be started')

          return (await browserCTX.execute(
            { taskID, account, accountID },
            async ({ page, data: { taskID, account, accountID } }) => {
              await init()
              await logIntoApolloAndUpgradeAccountManually(
                taskID,
                { page } as BrowserContext,
                account
              )
              const creditsInfo = await logIntoApolloAndGetCreditsInfo(
                taskID,
                { page } as BrowserContext,
                account
              )
              return await updateAccount({ _id: accountID }, creditsInfo) // (FIX)
            }
          )) as Promise<IAccount>
        } finally {
          /* empty */
        }
      }
    )

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const upgradeAutomatically = async (id: string) => {
  console.log('upgradeAccounts')
  try {
    const accountID = id
    if (!accountID) throw new Error('Failed to check account, please provide valid id')

    const account = await AccountModel.findById(accountID).lean()
    if (!account) throw new Error('Failed to find account')

    const taskID = generateID()
    taskQueue.enqueue(
      taskID,
      'apollo',
      'upgrade',
      `Upgrading ${account.domainEmail} automatically`,
      { accountID },
      async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'upgrade',
          message: `Upgrading ${account.domainEmail} automatically`,
          data: { accountID }
        })

        try {
          const browserCTX = await scraper.newBrowser(false)
          if (!browserCTX)
            throw new AppError(taskID, 'Failed to confirm account, browser could not be started')

          return (await browserCTX.execute(
            { taskID, account, accountID },
            async ({ page, data: { taskID, account, accountID } }) => {
              await init()
              await logIntoApolloAndUpgradeAccount(taskID, { page } as BrowserContext, account)
              const creditsInfo = await logIntoApolloAndGetCreditsInfo(
                taskID,
                { page } as BrowserContext,
                account
              )
              return await updateAccount({ _id: accountID }, creditsInfo) // (FIX)
            }
          )) as Promise<IAccount>
        } finally {
          /* empty */
        }
      }
    )

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const checkAccount = async (id: string) => {
  console.log('checkAccounts')
  try {
    const accountID = id
    if (!accountID) throw new Error('Failed to check account, please provide valid id')

    const account = await AccountModel.findById(accountID).lean()
    if (!account) throw new Error('Failed to find account')

    const taskID = generateID()
    taskQueue.enqueue(
      taskID,
      'apollo',
      'check',
      `Getting information on ${account.domainEmail} credits`,
      { accountID },
      async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'check',
          message: `Getting information on ${account.domainEmail} credits`,
          data: { accountID }
        })

        try {
          const browserCTX = await scraper.newBrowser(false)
          if (!browserCTX)
            throw new AppError(taskID, 'Failed to confirm account, browser could not be started')

          return (await browserCTX.execute(
            { taskID, account, accountID },
            async ({ page, data: { taskID, account, accountID } }) => {
              await init()
              const creditsInfo = await logIntoApolloAndGetCreditsInfo(
                taskID,
                { page } as BrowserContext,
                account
              )
              return await updateAccount({ _id: accountID }, creditsInfo)
            }
          )) as Promise<IAccount>
        } finally {
          /* empty */
        }
      }
    )

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const deleteAccount = async (id: string) => {
  console.log('deleteAccounts')
  try {
    const accountID = id
    if (!accountID) throw new Error('Failed to delete account, please provide valid id')

    await AccountModel.deleteOne({ _id: accountID }).lean()

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const loginAuto = async (id: string) => {
  console.log('loginauto')
  try {
    const accountID = id
    if (!accountID) throw new Error('Failed to login, invalid id')

    const account = await AccountModel.findById(accountID).lean()
    if (!account) throw new Error('Failed to login, cannot find account')

    const taskID = generateID()
    taskQueue.enqueue(
      taskID,
      'apollo',
      'login',
      `Logging into ${account.domainEmail} apollo account`,
      { accountID },
      async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'login',
          message: `Logging into ${account.domainEmail} apollo account`,
          data: { accountID }
        })

        try {
          const browserCTX = await scraper.newBrowser(false)
          if (!browserCTX)
            throw new AppError(taskID, 'Failed to confirm account, browser could not be started')

          return (await browserCTX.execute(
            { taskID, accountID, account },
            async ({ page, data: { taskID, accountID, account } }) => {
              await init()
              io.emit('apollo', { taskID, message: 'attempting to login' })
              await logIntoApollo(taskID, { page } as BrowserContext, account).then(() => {
                io.emit('apollo', { taskID, message: 'login complete' })
              })

              io.emit('apollo', { taskID, message: 'attempting to update browser cookies in db' })
              const cookies = await getBrowserCookies({ page } as BrowserContext).then(() => {
                io.emit('apollo', { taskID, message: 'collected browser cookies' })
              })

              io.emit('apollo', { taskID, message: 'saving browser cookies in db' })
              await updateAccount({ _id: accountID }, { cookie: JSON.stringify(cookies) })
            }
          )) as Promise<IAccount>
        } finally {
          /* empty */
        }
      }
    )

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const addAccount = async ({
  selectedDomainn,
  addTypee,
  emaill,
  passwordd,
  recoveryEmaill,
  domainEmaill
}) => {
  console.log('addAccount')

  try {
    const selectedDomain = selectedDomainn
    const addType = addTypee
    const email = emaill || import.meta.env.MAIN_VITE_AUTHEMAIL
    const password = passwordd
    const recoveryEmail = recoveryEmaill
    const domainEmail = domainEmaill || email
    const domain = email
    let account: Partial<IAccount>
    const taskID = generateID()

    if (!addType) throw new Error('Failed to add account, invalid request params')

    if (addType === 'domain') {
      if (!selectedDomain) throw new Error('Failed to add account, domain not provided')
      const d = await DomainModel.findOne({ domain: selectedDomain }).lean()
      if (!d) throw new Error('Failed to add account, domain could not be found')

      account = {
        // (FIX) make sure it does not try to use domain email that already exists
        domainEmail: `${generateSlug(2)}@${selectedDomain}`,
        domain: selectedDomain,
        email: d.authEmail,
        password: d.authPassword,
        apolloPassword: generateID()
      }

      // (FIX) better error handling (show user correct error)
      await mailbox.getConnection(
        {
          ...accountToMailbox('', account as IAccount),
          aliasEmail: account.domainEmail
        } as MailboxAuthOptions,
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
        recoveryEmail
      }

      const accountExists = ['gmail', 'outlook', 'hotmail'].includes(getDomain(domainEmail))
        ? await AccountModel.findOne({ email }).lean()
        : await AccountModel.findOne({ domainEmail }).lean()

      if (accountExists) throw new Error('Failed to create new account, account already exists')
    }

    await taskQueue.enqueue(
      taskID,
      'apollo',
      'create',
      `adding ${account.domainEmail}`,
      { domainEmail: account.domainEmail },
      async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'create',
          message: `adding ${account.domainEmail}`
        })

        try {
          const browserCTX = await scraper.newBrowser(false)
          if (!browserCTX)
            throw new AppError(taskID, 'Failed to confirm account, browser could not be started')

          return (await browserCTX.execute(
            { taskID, account },
            async ({ page, data: { taskID, account } }) => {
              await init()
              await signupForApollo(taskID, { page } as BrowserContext, account)
              // (FIX) indicate that account exists on db but not verified via email or apollo
              return await AccountModel.create(account)
            }
          )) as Promise<IAccount>
        } finally {
          /* empty */
        }
      }
    )

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

export const getAccounts = async () => {
  console.log('getAccounts')
  try {
    const accounts = await AccountModel.find({}).lean()

    return { ok: true, message: null, data: accounts }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

export const updateAcc = async (id: string, fields: Record<string, any>) => {
  console.log('updateAccount')
  try {
    const accountID: string = id
    if (!accountID) throw new Error('Failed to update account, invalid body')

    //
    const updatedAccount = await updateAccount({ _id: accountID }, fields)
    if (!updateAccount) throw new Error('Failed to update account')

    return { ok: true, message: null, data: updatedAccount }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

export const loginManually = async (id: string) => {
  console.log('loginManually')
  try {
    const accountID = id
    if (!accountID) throw new Error('Failed to start demining, invalid request body')

    const account = await AccountModel.findById(accountID)
    if (!account) throw new Error("Failed to start demining, couldn't find account")
    if (account.domain === 'default') throw new Error('Failed to start manual login, invalid email')

    const taskID = generateID()
    await taskQueue.enqueue(
      taskID,
      'apollo',
      'manualLogin',
      `Login into ${account.domainEmail}`,
      { accountID },
      async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'manualLogin',
          message: `Login into ${account.domainEmail}`,
          data: { accountID }
        })

        try {
          const browserCTX = await scraper.newBrowser(false)
          if (!browserCTX)
            throw new AppError(taskID, 'Failed to confirm account, browser could not be started')

          return (await browserCTX.execute(
            { taskID, account, accountID },
            async ({ page, data: { taskID, account, accountID } }) => {
              await init()
              await manuallyLogIntoApollo(taskID, { page } as BrowserContext, account)
              await waitForNavigationTo(
                taskID,
                { page } as BrowserContext,
                '/settings/account',
                'settings page'
              ).then(async () => {
                const cookies = await getBrowserCookies({ page } as BrowserContext)
                return await updateAccount({ _id: accountID }, { cookie: JSON.stringify(cookies) })
              })
            }
          )) as Promise<IAccount>
        } finally {
          /* empty */
        }
      }
    )

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

export const demine = async (id: string = '65a50efc3c13f3197ddecf42') => {
  console.log('mines')
  try {
    const accountID = id
    if (!accountID) throw new Error('Failed to start demining, invalid request body')

    const account = await AccountModel.findById(accountID)
    if (!account) throw new Error("Failed to start demining, couldn't find account")
    const taskID = generateID()
    await taskQueue.enqueue(
      taskID,
      'apollo',
      'demine',
      `Demine ${account.domainEmail} popups`,
      { accountID },
      async () => {
        // io.emit('apollo', {
        //   taskID,
        //   taskType: 'demine',
        //   message: `Demine ${account.domainEmail} popups`,
        //   data: { accountID }
        // })

        try {
          const browserCTX = await scraper.newBrowser(false)
          if (!browserCTX) {
            throw new AppError(taskID, 'Failed to confirm account, browser could not be started')
          }
          return (await browserCTX.execute(
            { taskID, account, accountID },
            async ({ page, data: { taskID, account, accountID } }) => {
              await init()
              await logIntoApollo(taskID, { page } as BrowserContext, account)
              await waitForNavigationTo(
                taskID,
                { page } as BrowserContext,
                'settings/account'
              ).then(async () => {
                const cookies = await getBrowserCookies({ page } as BrowserContext)
                return await updateAccount({ _id: accountID }, { cookie: JSON.stringify(cookies) })
              })
            }
          )) as Promise<IAccount>
        } finally {
          /* empty */
        }
      }
    )

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}
