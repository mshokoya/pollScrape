import { AccountModel_, IAccount } from './models/accounts'
import { IProxy, ProxyModel_ } from './models/proxy'
import { parseProxy, apolloGetParamsFromURL } from './util'
import { generateSlug } from 'random-word-slugs'
import { IRecord, IRecords, RecordModel_ } from './models/records'
import { IMetaData, MetaDataModel_ } from './models/metadata'
import { v4 as uuidv4 } from 'uuid'
import { CreditsInfo } from '../actions/apollo/lib/util'
import { AppError } from '../util'
import { sequelize } from './db'

// ==================================================================

export const addAccountToDB = async (account: Partial<IAccount>): Promise<IAccount> => {
  const acc = AccountModel_.findOne({ email: account.email })

  if (acc !== null) throw new Error('account already exists')

  const newAcc = await AccountModel_.create(account)

  return newAcc
}

export const updateAccount = async (
  filter: Record<string, any>,
  data: Partial<IAccount>
): Promise<IAccount> => {
  return (await AccountModel_.findOneAndUpdate(filter, data)) as IAccount
}

export const addProxyToDB = async (p: string): Promise<IProxy | null> => {
  const fmtProxy = parseProxy(p)
  return (await ProxyModel_.findOneAndUpdate({ proxy: p }, fmtProxy)) as IProxy | null
}

export const saveScrapeToDB = async (
  taskID: string,
  account: IAccount,
  meta: IMetaData,
  credits: CreditsInfo,
  cookies: string[],
  listName: string,
  range: [min: number, max: number],
  data: IRecord[],
  proxy: string | null
): Promise<{ meta: IMetaData; account: IAccount }> => {
  const t = await sequelize.transaction()
  try {
    // ACCOUNT UPDATE
    const newAcc = await AccountModel_.findOneAndUpdate(
      { id: account.id },
      {
        cookies: JSON.stringify(cookies),
        lastUsed: new Date().getTime(),
        history: account.history,
        proxy,
        ...credits
      },
      { transaction: t }
    )

    // METADATA UPDATE
    const scrapeID = uuidv4()

    let newMeta = await MetaDataModel_.findOne({ id: meta.id })

    // (FIX) ?? is thast suppose to be continue or break ?
    for (const l of newMeta.accounts) {
      // if already exist do nothing (this is to make sure account is stored in meta, you can do this earlier in the request)
      if (l.accountID === account.id && l.range[0] === range[0] && l.range[1] === range[1]) {
        continue
      } else {
        newMeta = await MetaDataModel_.pushToArray(
          { id: meta.id },
          'accounts',
          { accountID: account.id, range },
          { transaction: t }
        )
        break
      }
    }

    newMeta = await MetaDataModel_.pushToArray(
      { id: meta.id },
      'scrapes',
      { scrapeID, listName },
      { transaction: t }
    )

    // RECORD UPDATE
    const fmtData: Omit<IRecords, 'id'>[] = data.map((d) => ({ scrapeID, url: meta.url, data: d }))

    await RecordModel_.bulkCreate(fmtData, { transaction: t })

    await t.commit()

    return { meta: newMeta, account: newAcc }
  } catch (error) {
    t.rollback()
    throw new AppError(taskID, 'failed to save scrape to db')
  }
}

export const initMeta = async (name: string, url: string): Promise<IMetaData> => {
  const params = apolloGetParamsFromURL(url) // sets page to 1

  const newMeta = await MetaDataModel_.create({
    name,
    // name: generateSlug(),
    url,
    params: params
  })

  return newMeta
}

export const getAllApolloAccounts = async (): Promise<IAccount[]> => {
  return await AccountModel_.findAll()
}

export const deleteMetaAndRecords = async (metaID: string) => {
  const t = await sequelize.transaction()

  try {
    const meta = await MetaDataModel_.findOne({ id: metaID })
    if (!meta) {
      throw new Error('failed to find metadata')
    }

    await MetaDataModel_.findOneAndDelete({ id: metaID }, { transaction: t })

    const scrapeIds = meta.scrapes.map((m) => m.scrapeID)

    // https://stackoverflow.com/a/34917715/5252283
    await RecordModel_.findOneAndDelete({ scrapeID: scrapeIds as any }, { transaction: t })

    await t.commit()
  } catch (error) {
    await t.rollback()
    throw new Error('failed to delete meta data & records')
  }
}

export const updateMeta = async (meta: Partial<IMetaData> & Required<{ id: string }>) => {
  const newMeta = await MetaDataModel_.findOneAndUpdate({ id: meta.id }, meta)
  if (!newMeta) throw new Error('failed to update metadata')
  return newMeta
}

export const updateDBForNewScrape = async (
  taskID: string,
  meta: IMetaData,
  account: IAccount,
  listName: string,
  scrapeID: string
) => {
  const t = await sequelize.transaction()
  try {
    // METADATA UPDATE
    await MetaDataModel_.pushToArray(
      { id: meta.id },
      'scrapes',
      { scrapeID, listName, date: new Date().getTime(), length: 0 },
      { transaction: t }
    )

    // ACCOUNT UPDATE
    await AccountModel_.pushToArray(
      { id: account.id },
      'history',
      [null, null, listName, scrapeID],
      { transaction: t }
    )

    await t.commit()
  } catch (err) {
    await t.rollback()
    throw new AppError(taskID, err.message)
  }
}

export const saveLeadsFromRecovery = async (
  taskID: string,
  meta: IMetaData,
  account: IAccount,
  data: IRecord[],
  scrapeDate: number,
  scrapeID: string,
  listName: string,
  proxy: string | null
) => {
  const t = await sequelize.transaction()
  try {
    // ACCOUNT UPDATE
    const newAcc = await AccountModel_.findOneAndUpdate(
      { id: account.id },
      {
        lastUsed: Math.max(scrapeDate, account.lastUsed),
        proxy,
        history: account.history.map((h) =>
          h[2] === listName ? [data.length, scrapeDate, listName, scrapeID] : h
        )
      },
      { transaction: t }
    )

    if (!newAcc) {
      // await t.rollback()
      throw new AppError(
        taskID,
        'failed to update account after scrape, if this continues please contact developer'
      )
    }

    // METADATA UPDATE
    const newMeta = await MetaDataModel_.findOneAndUpdate(
      { id: meta.id },
      {
        scrapes: meta.scrapes.map((s) =>
          s.listName === listName ? { ...s, length: data.length } : s
        )
      },
      { transaction: t }
    )

    if (!newMeta) {
      // await t.rollback()
      throw new AppError(
        taskID,
        'failed to update meta after scrape, if this continues please contact developer'
      )
    }

    // RECORD UPDATE
    const fmtData: Omit<IRecords, 'id'>[] = data.map((d) => ({ scrapeID, url: meta.url, data: d }))
    await RecordModel_.bulkCreate(fmtData, { transaction: t })

    await t.commit()
  } catch (err) {
    await t.rollback()
    throw new AppError(taskID, err)
  }
}
