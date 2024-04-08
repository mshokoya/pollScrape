import { updateAccount } from '../../../database'
import { AccountModel_, IAccount } from '../../../database/models/accounts'
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
import {
  getBrowserCookies,
  // logIntoApolloThenVisit,
  waitForNavigationTo
} from '../lib/util'
import { AppError } from '../../../util'
import { io } from '../../../websockets'
import { mailbox } from '../../../mailbox'

export const confirmAccount = async ({
  taskID,
  account
}: {
  taskID: string
  account: IAccount
}) => {
  const browserCTX = await scraper.newBrowser(false)
  if (!browserCTX)
    throw new AppError(taskID, 'Failed to confirm account, browser could not be started')
  try {
    const newAccount = await completeApolloAccountConfimation(taskID, browserCTX, account)
    if (!newAccount)
      throw new AppError(taskID, 'Failed to confirm account, could not complete the process')
    return newAccount
  } finally {
    await scraper.close(browserCTX)
    await mailbox.relinquishConnection(process.env.AUTHEMAIL)
  }
}

export const upgradeManually = async ({
  taskID,
  account
}: {
  taskID: string
  account: IAccount
}) => {
  const browserCTX = await scraper.newBrowser(false)
  if (!browserCTX)
    throw new AppError(taskID, 'Failed to confirm account, browser could not be started')
  try {
    // if (account.cookies) browserCTX.page.setCookie(JSON.parse(account.cookies))
    await logIntoApolloAndUpgradeAccountManually(taskID, browserCTX, account)
    const creditsInfo = await logIntoApolloAndGetCreditsInfo(taskID, browserCTX, account)
    return await updateAccount({ id: account.id }, creditsInfo)
  } finally {
    await scraper.close(browserCTX)
  }
}

export const upgradeAutomatically = async ({
  taskID,
  accountID,
  account
}: {
  taskID: string
  accountID: string
  account: IAccount
}) => {
  const browserCTX = await scraper.newBrowser(false)
  if (!browserCTX)
    throw new AppError(taskID, 'Failed to confirm account, browser could not be started')
  try {
    // if (account.cookies) browserCTX.page.setCookie(JSON.parse(account.cookies))
    await logIntoApolloAndUpgradeAccount(taskID, browserCTX, account)
    const creditsInfo = await logIntoApolloAndGetCreditsInfo(taskID, browserCTX, account)
    return await updateAccount({ id: accountID }, creditsInfo) // (FIX)
  } finally {
    await scraper.close(browserCTX)
  }
}

export const checkAccount = async ({
  taskID,
  accountID,
  account
}: {
  taskID: string
  accountID: string
  account: IAccount
}) => {
  const browserCTX = await scraper.newBrowser(false)
  if (!browserCTX)
    throw new AppError(taskID, 'Failed to confirm account, browser could not be started')
  try {
    // if (account.cookies) browserCTX.page.setCookie(JSON.parse(account.cookies))
    const creditsInfo = await logIntoApolloAndGetCreditsInfo(taskID, browserCTX, account)
    return await updateAccount({ id: accountID }, creditsInfo)
  } finally {
    await scraper.close(browserCTX)
  }
}

export const loginAuto = async ({
  taskID,
  accountID,
  account
}: {
  taskID: string
  accountID: string
  account: IAccount
}) => {
  const browserCTX = await scraper.newBrowser(false)

  if (!browserCTX)
    throw new AppError(taskID, 'Failed to confirm account, browser could not be started')
  try {
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
    await updateAccount({ id: accountID }, { cookies: JSON.stringify(cookies) })
  } finally {
    await scraper.close(browserCTX)
  }
}

export const addAccount = async ({ taskID, account }: { taskID: string; account: IAccount }) => {
  const browserCTX = await scraper.newBrowser(false)
  if (!browserCTX)
    throw new AppError(taskID, 'Failed to confirm account, browser could not be started')
  try {
    await signupForApollo(taskID, browserCTX, account)
    // (FIX) indicate that account exists on db but not verified via email or apollo
    return await AccountModel_.create(account)
  } finally {
    await scraper.close(browserCTX)
  }
}

export const loginManually = async ({
  taskID,
  accountID,
  account
}: {
  taskID: string
  accountID: string
  account: IAccount
}) => {
  const browserCTX = await scraper.newBrowser(false)
  if (!browserCTX)
    throw new AppError(taskID, 'Failed to confirm account, browser could not be started')
  try {
    await manuallyLogIntoApollo(taskID, browserCTX, account)
    await waitForNavigationTo(taskID, browserCTX, '/settings/account', 'settings page').then(
      async () => {
        const cookies = await getBrowserCookies(browserCTX)
        return await updateAccount({ id: accountID }, { cookies: JSON.stringify(cookies) })
      }
    )
  } finally {
    await scraper.close(browserCTX)
  }
}

export const demine = async ({
  taskID,
  accountID,
  account
}: {
  taskID: string
  accountID: string
  account: IAccount
}) => {
  const browserCTX = await scraper.newBrowser(false)
  if (!browserCTX)
    throw new AppError(taskID, 'Failed to confirm account, browser could not be started')
  try {
    // if (account.cookies) browserCTX.page.setCookie(JSON.parse(account.cookies))
    await logIntoApollo(taskID, browserCTX, account)
    await waitForNavigationTo(taskID, browserCTX, 'settings/account').then(async () => {
      const cookies = await getBrowserCookies(browserCTX)
      return await updateAccount({ id: accountID }, { cookies: JSON.stringify(cookies) })
    })
  } finally {
    await scraper.close(browserCTX)
  }
}
