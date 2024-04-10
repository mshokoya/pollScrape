import { updateAccount } from '../../../database'
import { AccountModel_, IAccount } from '../../../database/models/accounts'
import { DomainModel_ } from '../../../database/models/domain'
import { accountToMailbox, mailbox, MailboxAuthOptions } from '../../../mailbox'
import { scrapeQueue } from '../../../scrape-queue'
import { taskQueue } from '../../../task-queue'
import { generateID, generateSlug, getDomain } from '../../../util'
import { io } from '../../../websockets'
import { apolloConfirmAccountEvent } from '../lib'

export const TconfirmAccount = async (accountID: string) => {
  console.log('confirm')
  const taskID = generateID()

  try {
    if (!accountID) throw new Error('Failed to check account, please provide valid id')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error('Failed to find account')
    // if (account.verified) throw new Error('Request Failed, account is already verified');

    taskQueue.enqueue(
      taskID,
      'apollo',
      'confirm',
      `confirming account ${account.email}`,
      { accountID },
      async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'confirm',
          message: `confirming account ${account.email}`,
          data: { accountID }
        })
        scrapeQueue.enqueue(taskID, 'apollo', 'cfma', { account })
      }
    )

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const TupgradeManually = async (accountID: string) => {
  console.log('upgradeAccountManual')
  try {
    if (!accountID) throw new Error('Failed to check account, please provide valid id')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error('Failed to find account')

    const taskID = generateID()
    taskQueue.enqueue(
      taskID,
      'apollo',
      'manualUpgrade',
      `Upgrading ${account.email} manually`,
      { accountID },
      async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'manualUpgrade',
          message: `Upgrading ${account.email} manually`,
          data: { accountID }
        })
        scrapeQueue.enqueue(taskID, 'apollo', 'um', { account })
      }
    )

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const TupgradeAutomatically = async (accountID: string) => {
  console.log('upgradeAccounts')
  try {
    if (!accountID) throw new Error('Failed to check account, please provide valid id')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error('Failed to find account')

    const taskID = generateID()
    taskQueue.enqueue(
      taskID,
      'apollo',
      'upgrade',
      `Upgrading ${account.email} automatically`,
      { accountID },
      async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'upgrade',
          message: `Upgrading ${account.email} automatically`,
          data: { accountID }
        })
        scrapeQueue.enqueue(taskID, 'apollo', 'ua', { account })
      }
    )

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const TcheckAccount = async (accountID: string) => {
  console.log('checkAccounts')
  try {
    if (!accountID) throw new Error('Failed to check account, please provide valid id')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error('Failed to find account')

    const taskID = generateID()
    taskQueue.enqueue(
      taskID,
      'apollo',
      'check',
      `Getting information on ${account.email} credits`,
      { accountID },
      async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'check',
          message: `Getting information on ${account.email} credits`,
          data: { accountID }
        })
        scrapeQueue.enqueue(taskID, 'apollo', 'chka', { account })
      }
    )

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const TdeleteAccount = async (accountID: string) => {
  console.log('deleteAccounts')
  try {
    if (!accountID) throw new Error('Failed to delete account, please provide valid id')

    const deleteAmount = await AccountModel_.findOneAndDelete({ id: accountID })
    if (!deleteAmount) throw new Error('Failed to delete account')

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const TloginAuto = async (accountID: string) => {
  console.log('loginauto')
  try {
    if (!accountID) throw new Error('Failed to login, invalid id')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error('Failed to login, cannot find account')

    const taskID = generateID()
    taskQueue.enqueue(
      taskID,
      'apollo',
      'login',
      `Logging into ${account.email} apollo account`,
      { accountID },
      async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'login',
          message: `Logging into ${account.email} apollo account`,
          data: { accountID }
        })
        scrapeQueue.enqueue(taskID, 'apollo', 'la', { account })
      }
    )

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const TaddAccount = async ({
  selectedDomain: selectedDomain,
  addType,
  email: emaill,
  password,
  recoveryEmail
}) => {
  console.log('addAccount')

  try {
    // @ts-ignore
    const email = emaill || import.meta.env.MAIN_VITE_AUTHEMAIL
    const domain = email
    let account: Partial<IAccount>
    const taskID = generateID()

    if (!addType) throw new Error('Failed to add account, invalid request params')

    if (addType === 'domain') {
      if (!selectedDomain) throw new Error('Failed to add account, domain not provided')
      const d = await DomainModel_.findOne({ domain: selectedDomain })
      if (!d) throw new Error('Failed to add account, domain could not be found')

      account = {
        // (FIX) make sure it does not try to use domain email that already exists
        email: `${generateSlug(2)}@${selectedDomain}`,
        domain: selectedDomain,
        password: generateID()
      }

      // (FIX) better error handling (show user correct error)
      // (FIX) remove aliasEmail.. use env email
      await mailbox.getConnection(
        {
          ...accountToMailbox('', account as IAccount),
          aliasEmail: account.email
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
        email,
        password,
        recoveryEmail
      }

      const accountExists = ['gmail', 'outlook', 'hotmail'].includes(getDomain(email))
        ? await AccountModel_.findOne({ email })
        : await AccountModel_.findOne({ email })

      if (accountExists) throw new Error('Failed to create new account, account already exists')
    }

    await taskQueue.enqueue(
      taskID,
      'apollo',
      'create',
      `adding ${account.email}`,
      { email: account.email },
      async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'create',
          message: `adding ${account.email}`
        })
        scrapeQueue.enqueue(taskID, 'apollo', 'aa', { account })
      }
    )

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

export const TgetAccounts = async () => {
  console.log('getAccounts')
  try {
    const accounts = await AccountModel_.findAll()

    return { ok: true, message: null, data: accounts }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

export const TupdateAcc = async (accountID: string, fields: Record<string, any>) => {
  console.log('updateAccount')
  try {
    if (!accountID) throw new Error('Failed to update account, invalid body')

    //
    const updatedAccount = await updateAccount({ id: accountID }, fields)
    if (!updateAccount) throw new Error('Failed to update account')

    return { ok: true, message: null, data: updatedAccount }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

export const TloginManually = async (accountID: string) => {
  console.log('loginManually')
  try {
    if (!accountID) throw new Error('Failed to start demining, invalid request body')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error("Failed to start demining, couldn't find account")
    if (account.domain === 'default') throw new Error('Failed to start manual login, invalid email')

    const taskID = generateID()
    await taskQueue.enqueue(
      taskID,
      'apollo',
      'manualLogin',
      `Login into ${account.email}`,
      { accountID },
      async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'manualLogin',
          message: `Login into ${account.email}`,
          data: { accountID }
        })
        scrapeQueue.enqueue(taskID, 'apollo', 'lm', { account })
      }
    )

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

export const Tdemine = async (accountID: string) => {
  console.log('mines')
  try {
    if (!accountID) throw new Error('Failed to start demining, invalid request body')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error("Failed to start demining, couldn't find account")

    const taskID = generateID()
    await taskQueue.enqueue(
      taskID,
      'apollo',
      'demine',
      `Demine ${account.email} popups`,
      { accountID },
      async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'demine',
          message: `Demine ${account.email} popups`,
          data: { accountID }
        })
        scrapeQueue.enqueue(taskID, 'apollo', 'dm', { account })
      }
    )

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}
