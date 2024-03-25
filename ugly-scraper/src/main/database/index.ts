import { startSession } from "mongoose";
import { AccountModel, IAccount } from "./models/accounts";
import { IProxy, ProxyModel } from "./models/proxy";
import { parseProxy, apolloGetParamsFromURL } from "./util";
import { generateSlug } from "random-word-slugs";
import { IRecord, RecordsModel } from "./models/records";
import { IMetaData, MetadataModel } from "./models/metadata";
import { v4 as uuidv4 } from 'uuid';
import { CreditsInfo } from "../scraper/apollo/util";
import { AppError } from "../util";

export const addAccountToDB = async (account: Partial<IAccount>): Promise<IAccount> => {
  const acc = AccountModel.findOne({email: account.email})

  if (acc !== null) throw new Error('account already exists')
  
  const newAcc = await AccountModel.create(account)

  return newAcc
}

export const updateAccount = async (filter: Record<string, any>, data: Partial<IAccount>, opts?: Record<string, string>): Promise<IAccount> => {
  const account = await AccountModel.findOneAndUpdate(
    filter,
    { $set : data },
    { new: true, ...opts }
  ).lean() as IAccount;

  return account
}

export const addProxyToDB = async (p: string): Promise<IProxy | null> => {
  const fmtProxy = parseProxy(p)
  return await ProxyModel.findOneAndUpdate(
    { proxy: p },
    { $set : fmtProxy },
    { new: true }
  ).lean() as IProxy | null;
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
  proxy: string | null,
): Promise<{meta: IMetaData, account: IAccount}> => {
  const session = await startSession();
  try {
    session.startTransaction();
    const updateOpts = { new: true, session }

    // ACCOUNT UPDATE
    const newAcc = await AccountModel.findOneAndUpdate(
      {_id: account._id},
      { 
        $set : {
          cookies:  JSON.stringify(cookies),
          lastUsed: new Date().getTime(),
          history: account.history,
          proxy,
          ...credits,
        }
      },
      updateOpts
    ).lean();


    if (!newAcc) {
      await session.abortTransaction();
      throw new AppError(taskID, 'failed to update account after scrape, if this continues please contact developer')
    }

    // METADATA UPDATE
    const scrapeID = uuidv4()
    
    const newMeta = await MetadataModel.findOneAndUpdate(
      {_id: meta._id}, 
      { 
        $addToSet: { accounts: {accountID: account._id, range} },
        $push: { scrapes: {scrapeID, listName} }
      }, 
      updateOpts
    ).lean();

    if (!newMeta) {
      await session.abortTransaction();
      throw new AppError(taskID, 'failed to update meta after scrape, if this continues please contact developer');
    }

    // RECORD UPDATE
    const fmtData = data.map((d) => ({scrapeID, url: meta.url, data: d}))

    await RecordsModel.insertMany(fmtData, updateOpts)

    await session.commitTransaction();

    return {meta: newMeta, account: newAcc}
  } catch (error) {
    await session.abortTransaction();
    throw new AppError(taskID, 'failed to save scrape to db')

  } finally {
    await session.endSession();
  }
}

export const initMeta = async (url: string): Promise<IMetaData> => {

  const params = apolloGetParamsFromURL(url) // sets page to 1

  const newMeta = await MetadataModel.create({
    name: generateSlug(), 
    url,
    params: params,
  })

  return newMeta
}

export const getAllApolloAccounts = async (): Promise<IAccount[]> => {
  return await AccountModel.find({}).lean() as IAccount[]
}

export const deleteMetaAndRecords = async (metaID: string) => {
  const session = await startSession();

  try {
    const meta = await MetadataModel.findOneAndDelete({_id: metaID}, {session}).lean();

    if (!meta) {
      await session.abortTransaction();
      throw new Error('failed to delete meta data & records')
    }

    const scrapeIds = meta.scrapes.map((m) => m.scrapeID);
    
    await RecordsModel.deleteMany({scrapeID: {'$in': scrapeIds}}, session)
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw new Error('failed to delete meta data & records')
  }
  await session.endSession();
}

export const updateMeta = async (meta: Partial<IMetaData> & Required<{_id: string}>) => {
  const newMeta = await MetadataModel.findByIdAndUpdate(
    {_id: meta._id},
    {$set: meta},
    {new: true}
  )

  if (!newMeta) throw new Error('failed to update metadata');

  return newMeta;
}

export const updateDBForNewScrape = async (taskID: string, meta: IMetaData, account: IAccount, listName: string, scrapeID: string) => {
  const session = await startSession();
  try {
    session.startTransaction();
    const updateOpts = { new: true, session }

    // METADATA UPDATE
    const newMeta = await MetadataModel.findOneAndUpdate(
      {_id: meta._id}, 
      { 
        $set: {
          scrapes: [...meta.scrapes, {scrapeID, listName, date: new Date().getTime(), length: 0}]
        },
      }, 
      updateOpts
    ).lean();

    if (!newMeta) {
      await session.abortTransaction();
      throw new AppError(taskID, 'failed to update meta after scrape, if this continues please contact developer');
    }


    // ACCOUNT UPDATE
    const newAccount = await AccountModel.findOneAndUpdate(
      {_id: account._id}, 
      { 
        $set: {
          history: [...account.history, [null, null, listName, scrapeID]]
        },
      }, 
      updateOpts
    ).lean();

    if (!newAccount) {
      await session.abortTransaction();
      throw new AppError(taskID, 'failed to update account after scrape, if this continues please contact developer');
    }

    await session.commitTransaction();  
  } finally {
    await session.endSession();
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
  const session = await startSession();
  try {
    session.startTransaction();
    const updateOpts = { new: true, session }

    // ACCOUNT UPDATE
    const newAcc = await AccountModel.findOneAndUpdate(
      {_id: account._id},
      { 
        $set : {
          lastUsed: Math.max(scrapeDate, account.lastUsed),
          history: account.history.map((h) => h[2] === listName ? [data.length, scrapeDate, listName, scrapeID] : h ),
          proxy,
        }
      },
      updateOpts
    ).lean();


    if (!newAcc) {
      await session.abortTransaction();
      throw new AppError(taskID, 'failed to update account after scrape, if this continues please contact developer')
    }

    // METADATA UPDATE
    const newMeta = await MetadataModel.findOneAndUpdate(
      {_id: meta._id}, 
      { 
        $set: {
          scrapes: meta.scrapes.map(s => s.listName === listName ? {...s, length: data.length} : s )
        },
      }, 
      updateOpts
    ).lean();

    if (!newMeta) {
      await session.abortTransaction();
      throw new AppError(taskID, 'failed to update meta after scrape, if this continues please contact developer');
    }

    // RECORD UPDATE
    const fmtData = data.map((d) => ({scrapeID, url: meta.url, data: d}))

    await RecordsModel.insertMany(fmtData, updateOpts)

    await session.commitTransaction();

    
  } catch (error) {
    await session.abortTransaction();
    throw new AppError(taskID, 'failed to save scrape to db')
  }
  await session.endSession();
}