import { TaskEnqueue } from '../../../../../shared'
import { updateAccount } from '../../../database'
import { AccountModel_, IAccount } from '../../../database/models/accounts'
import { DomainModel_ } from '../../../database/models/domain'
import { accountToMailbox, mailbox, MailboxAuthOptions } from '../../../mailbox'
import { scrapeQueue } from '../../../scrape-queue'
import { taskQueue } from '../../../task-queue'
import { generateID, generateSlug, getDomain } from '../../../util'
import { io } from '../../../websockets'
import {
  addAccount,
  checkAccount,
  confirmAccount,
  demine,
  loginAuto,
  loginManually,
  upgradeAutomatically,
  upgradeManually
} from '../actions'
import { apolloConfirmAccountEvent } from '../lib'

export const TconfirmAccount = async ({
  taskID,
  accountID,
  pid
}: {
  taskID?: string
  accountID: string
  pid: string
}) => {
  console.log('confirm')

  try {
    if (!accountID) throw new Error('Failed to check account, please provide valid id')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error('Failed to find account')
    // if (account.verified) throw new Error('Request Failed, account is already verified');

    taskID = taskID || generateID()
    taskQueue.enqueue({
      pid,
      taskID,
      taskGroup: 'apollo',
      taskType: 'confirm',
      message: `confirming account ${account.email}`,
      metadata: { accountID },
      action: async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'confirm',
          message: `confirming account ${account.email}`,
          data: { accountID }
        })
        if (global.forkID) {
          return await confirmAccount({ taskID, account })
        } else {
          scrapeQueue.enqueue({
            pid: taskID,
            taskGroup: 'apollo',
            taskType: 'cfma',
            taskArgs: { account }
          })
        }
      }
    })

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const TupgradeManually = async ({
  taskID,
  accountID,
  pid
}: {
  taskID?: string
  accountID: string
  pid: string
}) => {
  console.log('upgradeAccountManual')
  try {
    if (!accountID) throw new Error('Failed to check account, please provide valid id')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error('Failed to find account')

    taskID = taskID || generateID()
    taskQueue.enqueue({
      pid,
      taskID,
      taskGroup: 'apollo',
      taskType: 'manualUpgrade',
      message: `Upgrading ${account.email} manually`,
      metadata: { accountID },
      action: async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'manualUpgrade',
          message: `Upgrading ${account.email} manually`,
          data: { accountID }
        })
        if (global.forkID) {
          return await upgradeManually({ taskID, account })
        } else {
          scrapeQueue.enqueue({
            pid: taskID,
            taskGroup: 'apollo',
            taskType: 'um',
            taskArgs: { account }
          })
        }
      }
    })

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const TupgradeAutomatically = async ({
  taskID,
  accountID,
  pid
}: {
  taskID?: string
  accountID: string
  pid: string
}) => {
  console.log('upgradeAccounts')
  try {
    if (!accountID) throw new Error('Failed to check account, please provide valid id')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error('Failed to find account')

    taskID = taskID || generateID()
    taskQueue.enqueue({
      pid,
      taskID,
      taskGroup: 'apollo',
      taskType: 'upgrade',
      message: `Upgrading ${account.email} automatically`,
      metadata: { accountID },
      action: async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'upgrade',
          message: `Upgrading ${account.email} automatically`,
          data: { accountID }
        })
        if (global.forkID) {
          return await upgradeAutomatically({ taskID, account })
        } else {
          scrapeQueue.enqueue({
            pid: taskID,
            taskGroup: 'apollo',
            taskType: 'ua',
            taskArgs: { account }
          })
        }
      }
    })

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const TcheckAccount = async ({
  taskID,
  accountID,
  pid
}: {
  taskID?: string
  accountID: string
  pid: string
}) => {
  console.log('checkAccounts')
  try {
    if (!accountID) throw new Error('Failed to check account, please provide valid id')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error('Failed to find account')

    taskID = taskID || generateID()
    taskQueue.enqueue({
      pid,
      taskID,
      taskGroup: 'apollo',
      taskType: 'check',
      message: `Getting information on ${account.email} credits`,
      metadata: { accountID },
      action: async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'check',
          message: `Getting information on ${account.email} credits`,
          data: { accountID }
        })
        if (global.forkID) {
          return await checkAccount({ taskID, account })
        } else {
          scrapeQueue.enqueue({
            pid: taskID,
            taskType: 'apollo',
            taskGroup: 'chka',
            taskArgs: { account }
          })
        }
      }
    })

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

export const TloginAuto = async ({
  taskID,
  accountID,
  pid
}: {
  taskID?: string
  accountID: string
  pid: string
}) => {
  console.log('loginauto')
  try {
    if (!accountID) throw new Error('Failed to login, invalid id')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error('Failed to login, cannot find account')

    taskID = taskID || generateID()
    taskQueue.enqueue({
      pid,
      taskID,
      taskGroup: 'apollo',
      taskType: 'login',
      message: `Logging into ${account.email} apollo account`,
      metadata: { accountID },
      action: async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'login',
          message: `Logging into ${account.email} apollo account`,
          data: { accountID }
        })
        if (global.forkID) {
          return await loginAuto({ taskID, account })
        } else {
          scrapeQueue.enqueue({
            pid: taskID,
            taskGroup: 'apollo',
            taskType: 'la',
            taskArgs: { account }
          })
        }
      }
    })

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const TaddAccount = async ({
  selectedDomain,
  addType,
  email: emaill,
  password,
  recoveryEmail,
  taskID,
  pid
}: {
  taskID?: string
  addType: string
  selectedDomain: string
  email: string
  password: string
  recoveryEmail: string
  pid: string
}) => {
  console.log('addAccount')

  try {
    // @ts-ignore
    const email = emaill || import.meta.env.MAIN_VITE_AUTHEMAIL
    const domain = email
    let account: Partial<IAccount>
    taskID = taskID || generateID()

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

    await taskQueue.enqueue({
      pid,
      taskID,
      taskGroup: 'apollo',
      taskType: 'create',
      message: `adding ${account.email}`,
      metadata: { email: account.email },
      action: async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'create',
          message: `adding ${account.email}`
        })
        if (global.forkID) {
          // @ts-ignore
          return await addAccount({ taskID, account })
        } else {
          scrapeQueue.enqueue({
            pid: taskID,
            taskGroup: 'apollo',
            taskType: 'aa',
            taskArgs: { account }
          })
        }
      }
    })

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

export const TupdateAcc = async ({
  accountID,
  fields
}: {
  accountID: string
  fields: Record<string, any>
}) => {
  console.log('updateAccount')
  try {
    if (!accountID) throw new Error('Failed to update account, invalid body')

    const updatedAccount = await updateAccount({ id: accountID }, fields)
    if (!updateAccount) throw new Error('Failed to update account')

    return { ok: true, message: null, data: updatedAccount }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

export const TloginManually = async ({ accountID }: { accountID: string }) => {
  console.log('loginManually')
  try {
    if (!accountID) throw new Error('Failed to start demining, invalid request body')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error("Failed to start demining, couldn't find account")
    if (account.domain === 'default') throw new Error('Failed to start manual login, invalid email')

    const taskID = generateID()
    await taskQueue.enqueue({
      taskID,
      taskGroup: 'apollo',
      taskType: 'manualLogin',
      message: `Login into ${account.email}`,
      metadata: { accountID },
      action: async () => {
        io.emit('apollo', {
          taskID,
          taskType: 'manualLogin',
          message: `Login into ${account.email}`,
          data: { accountID }
        })
        if (global.forkID) {
          return await loginManually({ taskID, account })
        } else {
          scrapeQueue.enqueue({
            pid: taskID,
            action: loginManually,
            args: { account }
          })
        }
      }
    })

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

export const Tdemine = async ({ accountID }: { accountID: string }) => {
  console.log('mines')
  try {
    if (!accountID) throw new Error('Failed to start demining, invalid request body')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error("Failed to start demining, couldn't find account")

    const taskID = generateID()
    await taskQueue.enqueue({
      taskID,
      taskGroup: 'apollo',
      taskType: 'demine',
      message: `Demine ${account.email} popups`,
      metadata: { accountID },
      action: async () => {
        // (FIX) MOVE TO DEMINE FUNC.. i this its used to disable account in add "in use" colors on fronend
        // io.emit<TaskEnqueue>('apollo', {
        //   taskID,
        //   taskType: 'demine',
        //   message: `Demine ${account.email} popups`,
        //   metadata: { accountID }
        // })
        if (!global.forkID) {
          return await demine({ taskID, account })
        } else {
          scrapeQueue.enqueue({
            pid: taskID,
            action: demine,
            args: { account }
          })
        }
      }
    })

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}
