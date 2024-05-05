import { AddAccountArgs, IAccount, Timeout } from '../../../../../shared'
import { CHANNELS } from '../../../../../shared/util'
import { updateAccount } from '../../../database'
import { AccountModel_ } from '../../../database/models/accounts'
import { DomainModel_ } from '../../../database/models/domain'
import { accountToMailbox, mailbox, MailboxAuthOptions } from '../../../mailbox'
import { taskQueue } from '../../../task-queue'
import { generateID, generateSlug, getDomain } from '../../../util'
// import { io } from '../../../websockets'
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
  accountID,
  timeout
}: {
  accountID: string
  timeout?: Timeout
}) => {
  console.log('confirm')

  try {
    if (!accountID) throw new Error('Failed to check account, please provide valid id')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error('Failed to find account')
    // if (account.verified) throw new Error('Request Failed, account is already verified');

    const taskID = generateID()
    taskQueue.enqueue({
      taskID,
      taskGroup: 'apollo',
      taskType: 'confirm',
      timeout,
      useFork: taskQueue.useFork(),
      message: `confirming account ${account.email}`,
      metadata: { accountID, taskType: 'confirm' },
      action: async (signal: AbortSignal) => {
        // io.emit('apollo', {
        //   taskID,
        //   taskType: 'confirm',
        //   message: `confirming account ${account.email}`,
        //   data: { accountID }
        // })
        if (taskQueue.useFork()) {
          return taskQueue.execInFork({
            pid: taskID,
            taskGroup: 'apollo',
            action: CHANNELS.a_accountConfirm,
            args: { account },
            metadata: {
              taskGroup: 'apollo',
              taskType: 'confirm',
              metadata: { accountID }
            }
          })
        } else {
          // @ts-ignore
          return await confirmAccount({ taskID, account }, signal)
        }
      }
    })

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const TupgradeManually = async ({
  accountID,
  timeout
}: {
  accountID: string
  timeout?: Timeout
}) => {
  console.log('upgradeAccountManual')
  try {
    if (!accountID) throw new Error('Failed to check account, please provide valid id')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error('Failed to find account')

    const taskID = generateID()
    taskQueue.enqueue({
      taskID,
      taskGroup: 'apollo',
      taskType: 'manualUpgrade',
      timeout,
      useFork: taskQueue.useFork(),
      message: `Upgrading ${account.email} manually`,
      metadata: { accountID, taskType: 'manualUpgrade' },
      action: async (signal: AbortSignal) => {
        // io.emit('apollo', {
        //   taskID,
        //   taskType: 'manualUpgrade',
        //   message: `Upgrading ${account.email} manually`,
        //   data: { accountID }
        // })
        if (taskQueue.useFork()) {
          return taskQueue.execInFork({
            pid: taskID,
            taskGroup: 'apollo',
            action: CHANNELS.a_accountUpgradeManually,
            args: { account },
            metadata: {
              taskGroup: 'apollo',
              taskType: 'manualUpgrade',
              metadata: { accountID }
            }
          })
        } else {
          // @ts-ignore
          return await upgradeManually({ taskID, account }, signal)
        }
      }
    })

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const TupgradeAutomatically = async ({
  accountID,
  timeout
}: {
  accountID: string
  timeout?: Timeout
}) => {
  console.log('upgradeAccounts')
  try {
    if (!accountID) throw new Error('Failed to check account, please provide valid id')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error('Failed to find account')

    const taskID = generateID()
    taskQueue.enqueue({
      taskID,
      taskGroup: 'apollo',
      taskType: 'upgrade',
      timeout,
      useFork: taskQueue.useFork(),
      message: `Upgrading ${account.email} automatically`,
      metadata: { accountID },
      action: async (signal: AbortSignal) => {
        // io.emit('apollo', {
        //   taskID,
        //   taskType: 'upgrade',
        //   message: `Upgrading ${account.email} automatically`,
        //   data: { accountID }
        // })
        if (taskQueue.useFork()) {
          return taskQueue.execInFork({
            pid: taskID,
            taskGroup: 'apollo',
            action: CHANNELS.a_accountUpgradeAutomatically,
            args: { account },
            metadata: {
              taskGroup: 'apollo',
              taskType: 'upgrade',
              metadata: { accountID }
            }
          })
        } else {
          // @ts-ignore
          return await upgradeAutomatically({ taskID, account }, signal)
        }
      }
    })

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const TcheckAccount = async ({
  accountID,
  timeout
}: {
  accountID: string
  timeout?: Timeout
}) => {
  console.log('checkAccounts')
  try {
    if (!accountID) throw new Error('Failed to check account, please provide valid id')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error('Failed to find account')

    const taskID = generateID()
    taskQueue.enqueue({
      taskID,
      taskGroup: 'apollo',
      taskType: 'check',
      timeout,
      useFork: taskQueue.useFork(),
      message: `Getting information on ${account.email} credits`,
      metadata: { accountID, taskType: 'check' },
      action: async (signal: AbortSignal) => {
        // io.emit('apollo', {
        //   taskID,
        //   taskType: 'check',
        //   message: `Getting information on ${account.email} credits`,
        //   data: { accountID }
        // })
        if (taskQueue.useFork()) {
          return taskQueue.execInFork({
            pid: taskID,
            taskGroup: 'apollo',
            action: CHANNELS.a_accountCheck,
            args: { account },
            metadata: {
              taskGroup: 'apollo',
              taskType: 'check',
              metadata: { accountID }
            }
          })
        } else {
          // @ts-ignore
          return await checkAccount({ taskID, account }, signal)
        }
      }
    })

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: null }
  }
}

export const TdeleteAccount = async ({ accountID }: { accountID: string }) => {
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
  accountID,
  timeout
}: {
  accountID: string
  timeout?: Timeout
}) => {
  console.log('loginauto')
  try {
    if (!accountID) throw new Error('Failed to login, invalid id')

    const account = await AccountModel_.findById(accountID)
    if (!account) throw new Error('Failed to login, cannot find account')

    const taskID = generateID()
    taskQueue.enqueue({
      taskID,
      taskGroup: 'apollo',
      taskType: 'login',
      timeout,
      useFork: taskQueue.useFork(),
      message: `Logging into ${account.email} apollo account`,
      metadata: { accountID, taskType: 'login' },
      action: async (signal: AbortSignal) => {
        // io.emit('apollo', {
        //   taskID,
        //   taskType: 'login',
        //   message: `Logging into ${account.email} apollo account`,
        //   data: { accountID }
        // })
        if (taskQueue.useFork()) {
          console.log(`


            exec in fork

            `)
          return taskQueue.execInFork({
            pid: taskID,
            taskGroup: 'apollo',
            action: CHANNELS.a_accountLoginAuto,
            args: { account },
            metadata: {
              taskGroup: 'apollo',
              taskType: 'login',
              metadata: { accountID }
            }
          })
        } else {
          // @ts-ignore
          return await loginAuto({ taskID, account }, signal)
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
  timeout
}: AddAccountArgs & { timeout?: Timeout }) => {
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
          ...accountToMailbox(taskID, account as IAccount),
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

    const dummyAccountID = generateID()
    await taskQueue.enqueue({
      taskID,
      taskGroup: 'apollo',
      taskType: 'create',
      timeout,
      useFork: taskQueue.useFork(),
      message: `adding ${account.email}`,
      metadata: { email: account.email, accountID: dummyAccountID, taskType: 'create' },
      action: async (signal: AbortSignal) => {
        // io.emit('apollo', {
        //   taskID,
        //   taskType: 'create',
        //   message: `adding ${account.email}`
        // })
        if (taskQueue.useFork()) {
          return taskQueue.execInFork({
            pid: taskID,
            taskGroup: 'apollo',
            action: CHANNELS.a_accountAdd,
            args: { account },
            metadata: {
              taskGroup: 'apollo',
              taskType: 'create',
              metadata: {
                email: account.email,
                accountID: dummyAccountID
              }
            }
          })
        } else {
          // @ts-ignore
          return await addAccount({ taskID, account }, signal)
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

export const TloginManually = async ({
  accountID,
  timeout
}: {
  accountID: string
  timeout?: Timeout
}) => {
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
      timeout,
      useFork: taskQueue.useFork(),
      message: `Login into ${account.email}`,
      metadata: { accountID, taskType: 'manualLogin' },
      action: async (signal: AbortSignal) => {
        // io.emit('apollo', {
        //   taskID,
        //   taskType: 'manualLogin',
        //   message: `Login into ${account.email}`,
        //   data: { accountID }
        // })
        if (taskQueue.useFork()) {
          return taskQueue.execInFork({
            pid: taskID,
            taskGroup: 'apollo',
            action: CHANNELS.a_accountLoginManually,
            args: { account },
            metadata: {
              taskGroup: 'apollo',
              taskType: 'manualLogin',
              metadata: { accountID }
            }
          })
        } else {
          return await loginManually({ taskID, account }, signal)
        }
      }
    })

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

export const Tdemine = async ({ accountID, timeout }: { accountID: string; timeout?: Timeout }) => {
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
      timeout,
      useFork: taskQueue.useFork(),
      message: `Demine ${account.email} popups`,
      metadata: { accountID, taskType: 'demine' },
      action: async (signal: AbortSignal) => {
        // (FIX) MOVE TO DEMINE FUNC.. i this its used to disable account in add "in use" colors on fronend
        // io.emit<TaskEnqueue>('apollo', {
        //   taskID,
        //   taskType: 'demine',
        //   message: `Demine ${account.email} popups`,
        //   metadata: { accountID }
        // })
        if (taskQueue.useFork()) {
          return taskQueue.execInFork({
            pid: taskID,
            taskGroup: 'apollo',
            action: CHANNELS.a_accountDemine,
            args: { account },
            metadata: {
              taskType: CHANNELS.a_accountDemine,
              taskGroup: 'apollo',
              metadata: { accountID }
            }
          })
        } else {
          return await demine({ taskID, account }, signal)
        }
      }
    })

    return { ok: true, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}
