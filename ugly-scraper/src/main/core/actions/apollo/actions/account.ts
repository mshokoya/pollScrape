import { updateAccount } from '../../../database'
import { AccountModel_ } from '../../../database/models/accounts'
import { scraper } from '../lib/scraper'
import {
  completeApolloAccountConfimation,
  logIntoApollo,
  logIntoApolloAndGetCreditsInfo,
  logIntoApolloAndUpgradeAccount,
  logIntoApolloAndUpgradeAccountManually,
  manuallyLogIntoApollo,
  signupForApollo
} from '../lib'
import { getBrowserCookies, waitForNavigationTo } from '../lib/util'
import { AppError } from '../../../util'
import { io } from '../../../websockets'
import { mailbox } from '../../../mailbox'
import { IAccount } from '../../../../../shared'
import { setupApolloForScraping } from '../lib/apollo'

export const confirmAccount = async (
  { taskID, account }: { taskID: string; account: IAccount },
  signal: AbortSignal
) => {
  let browserCTX_ID: string

  console.log('ACCOUNT')
  console.log(account)

  try {
    return await new Promise(async (res, rej) => {
      signal.addEventListener('abort', () => {
        rej({ taskID, message: 'Failed to confirm account, task aborted' })
      })

      const browserCTX = await scraper.newBrowser(false)
      if (!browserCTX)
        throw new AppError(taskID, 'Failed to confirm account, browser could not be started')

      browserCTX_ID = browserCTX.id

      const newAccount = await completeApolloAccountConfimation(taskID, browserCTX, account)
      if (!newAccount)
        throw new AppError(taskID, 'Failed to confirm account, could not complete the process')
      res(newAccount)
    })
  } finally {
    await scraper.close(browserCTX_ID)
    await mailbox.relinquishConnection(process.env.AUTHEMAIL)
  }
}

export const upgradeManually = async (
  { taskID, account }: { taskID: string; account: IAccount },
  signal: AbortSignal
) => {
  let browserCTX_ID: string
  try {
    return await new Promise(async (res, rej) => {
      signal.addEventListener('abort', () => {
        rej({ taskID, message: 'Failed to upgrade account manually, task aborted' })
      })
      const browserCTX = await scraper.newBrowser(false)
      if (!browserCTX)
        throw new AppError(
          taskID,
          'Failed to upgrade account manually, browser could not be started'
        )

      browserCTX_ID = browserCTX.id

      // if (account.cookies) browserCTX.page.setCookie(JSON.parse(account.cookies))
      await logIntoApolloAndUpgradeAccountManually(taskID, browserCTX, account)
      const creditsInfo = await logIntoApolloAndGetCreditsInfo(taskID, browserCTX, account)
      const acc = await updateAccount({ id: account.id }, creditsInfo)
      res(acc)
    })
  } finally {
    await scraper.close(browserCTX_ID)
  }
}

export const upgradeAutomatically = async (
  { taskID, account }: { taskID: string; account: IAccount },
  signal: AbortSignal
) => {
  let browserCTX_ID: string
  try {
    return await new Promise(async (res, rej) => {
      signal.addEventListener('abort', () => {
        rej({ taskID, message: 'Failed to upgrade account automatically, task aborted' })
      })

      const browserCTX = await scraper.newBrowser(false)
      if (!browserCTX)
        throw new AppError(
          taskID,
          'Failed to upgrade account automatically, browser could not be started'
        )

      browserCTX_ID = browserCTX.id

      // if (account.cookies) browserCTX.page.setCookie(JSON.parse(account.cookies))
      await logIntoApolloAndUpgradeAccount(taskID, browserCTX, account)
      const creditsInfo = await logIntoApolloAndGetCreditsInfo(taskID, browserCTX, account)
      return await updateAccount({ id: account.id }, creditsInfo) // (FIX)
    })
  } finally {
    await scraper.close(browserCTX_ID)
  }
}

export const checkAccount = async (
  { taskID, account }: { taskID: string; account: IAccount },
  signal: AbortSignal
) => {
  let browserCTX_ID: string
  try {
    return await new Promise(async (res, rej) => {
      signal.addEventListener('abort', () => {
        rej({ taskID, message: 'Failed to check account, task aborted' })
      })

      const browserCTX = await scraper.newBrowser(false)
      if (!browserCTX)
        throw new AppError(taskID, 'Failed to check account, browser could not be started')

      browserCTX_ID = browserCTX.id

      const creditsInfo = await logIntoApolloAndGetCreditsInfo(taskID, browserCTX, account)

      const acc = await AccountModel_.findOneAndUpdate(
        { id: account.id },
        { ...creditsInfo, verified: 'yes' }
      )
      if (!acc) throw new AppError(taskID, 'failed to confirm account, update failed')

      res(acc)
    })
  } finally {
    await scraper.close(browserCTX_ID)
  }
}

export const loginAuto = async (
  { taskID, account }: { taskID: string; account: IAccount },
  signal: AbortSignal
) => {
  let browserCTX_ID: string

  try {
    return await new Promise(async (res, rej) => {
      signal.addEventListener('abort', () => {
        rej({ taskID, message: 'Failed to login automatically, task aborted' })
      })
      const browserCTX = await scraper.newBrowser(false)

      if (!browserCTX)
        throw new AppError(taskID, 'Failed to login automatically, browser could not be started')

      browserCTX_ID = browserCTX.id

      io.emit('apollo', { taskID, message: 'attempting to login' })
      await logIntoApollo(taskID, browserCTX, account).then(() => {
        io.emit('apollo', { taskID, message: 'login complete' })
      })

      io.emit('apollo', { taskID, message: 'attempting to update browser cookies in db' })
      const cookies = await getBrowserCookies(browserCTX).then((c) => {
        io.emit('apollo', { taskID, message: 'collected browser cookies' })
        return c
      })

      io.emit('apollo', { taskID, message: 'saving browser cookies in db' })
      await updateAccount({ id: account.id }, { cookies: JSON.stringify(cookies) })
    })
  } finally {
    await scraper.close(browserCTX_ID)
  }
}

export const addAccount = async (
  { taskID, account }: { taskID: string; account: IAccount },
  signal: AbortSignal
) => {
  let browserCTX_ID: string
  try {
    return await new Promise(async (res, rej) => {
      signal.addEventListener('abort', () => {
        rej({ taskID, message: 'Failed to confirm account, task aborted' })
      })
      const browserCTX = await scraper.newBrowser(false)
      if (!browserCTX)
        throw new AppError(taskID, 'Failed to confirm account, browser could not be started')
      browserCTX_ID = browserCTX.id
      await signupForApollo(taskID, browserCTX, account)
      // (FIX) indicate that account exists on db but not verified via email or apollo
      const acc = await AccountModel_.create(account)
      res(acc)
    })
  } finally {
    await scraper.close(browserCTX_ID)
  }
}

export const loginManually = async (
  { taskID, account }: { taskID: string; account: IAccount },
  signal: AbortSignal
) => {
  let browserCTX_ID: string

  try {
    return await new Promise(async (res, rej) => {
      signal.addEventListener('abort', () => {
        rej({ taskID, message: 'Failed to login manually, task aborted' })
      })
      const browserCTX = await scraper.newBrowser(false)
      if (!browserCTX)
        throw new AppError(taskID, 'Failed to  login manually, browser could not be started')

      browserCTX_ID = browserCTX.id

      await manuallyLogIntoApollo(taskID, browserCTX, account)
      const acc = await waitForNavigationTo(
        taskID,
        browserCTX,
        '/settings/account',
        'settings page'
      ).then(async () => {
        console.log('made it to here')
        const cookies = await getBrowserCookies(browserCTX)
        return await updateAccount({ id: account.id }, { cookies: JSON.stringify(cookies) })
      })

      res(acc)
    })
  } finally {
    await scraper.close(browserCTX_ID)
  }
}

export const demine = async (
  { taskID, account }: { taskID: string; account: IAccount },
  signal: AbortSignal
) => {
  let browserCTX_ID: string

  try {
    return await new Promise(async (res, rej) => {
      signal.addEventListener('abort', () => {
        rej({ taskID, message: 'Failed to demine account, task aborted' })
      })

      const browserCTX = await scraper.newBrowser(false)
      if (!browserCTX)
        throw new AppError(taskID, 'Failed to demine account, browser could not be started')

      browserCTX_ID = browserCTX.id

      await setupApolloForScraping(taskID, browserCTX, account).then(() => {
        io.emit('apollo', { taskID, message: 'successfully setup apollo for scraping' })
      })
      await waitForNavigationTo(taskID, browserCTX, 'settings/account').then(async () => {
        const cookies = await getBrowserCookies(browserCTX)
        const acc = await updateAccount({ id: account.id }, { cookies: JSON.stringify(cookies) })
        res(acc)
      })
    })
  } finally {
    await scraper.close(browserCTX_ID)
  }
}
