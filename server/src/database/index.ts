import { startSession } from "mongoose";
import { AccountModel, IAccount } from "./models/accounts";
import { IProxy, ProxyModel } from "./models/proxy";
import { parseProxy, rmPageFromURLQuery } from "./util";
import { generateSlug } from "random-word-slugs";
import { IRecord, RecordsModel } from "./models/records";
import { IMetaData, MetadataModel } from "./models/metadata";
import { v4 as uuidv4 } from 'uuid';

export const addAccountToDB = async (account: Partial<IAccount>): Promise<IAccount> => {
  const acc = AccountModel.findOne({email: account.email})

  if (acc !== null) throw new Error('account already exists')
  
  const newAcc = await AccountModel.create(account)

  return newAcc
}

export const addCookiesToAccount = async (_id: string, cookies: string[]): Promise<IAccount> => {
  const account = await AccountModel.findOneAndUpdate(
    {_id},
    { $set : {cookie: JSON.stringify(cookies)} },
    { new: true }
  ).lean() as IAccount;

  if (account === null) throw new Error('failed to save cookies')

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
  accountID: string, 
  cookies: string[], 
  url: string, 
  data: IRecord[],
  metadataID: string,
  proxy: string | null,
) => {
  const session = await startSession();
  try {
    session.startTransaction();
    const updateOpts = { new: true, session }

    // ACCOUNT UPDATE
    const newAcc = await AccountModel.findOneAndUpdate(
      {_id: accountID},
      { $set :{
        cookies:  JSON.stringify(cookies),
        proxy,
        lastUsed: new Date()
      }},
      updateOpts
    ).lean();


    if (!newAcc) {
      await session.abortTransaction();
      throw new Error('failed to update account after scrape, if this continues please contact developer')
    }

    // METADATA UPDATE
    const fmtURL = rmPageFromURLQuery(url)
    const scrapeID = uuidv4()
    
    const newMeta = await MetadataModel.findOneAndUpdate(
      {_id: metadataID}, 
      { 
        $set: { page: fmtURL.page},
        $push: { scrapes: {page: fmtURL.page, scrapeID} } // THIS MIGHT NOT WORK FIND ANOTHER WAY TO PUSH
      }, 
      updateOpts
    ).lean();

    if (!newMeta) {
      await session.abortTransaction();
      throw new Error('failed to update meta after scrape, if this continues please contact developer')
    }

    // RECORD UPDATE
    const fmtData = data.map((d) => ({scrapeID, url, page: fmtURL.page, data: d}))

    await RecordsModel.insertMany(fmtData, updateOpts)

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw new Error('failed to save scrape to db')
  }
  await session.endSession();
}

// https://www.ultimateakash.com/blog-details/IiwzQGAKYAo=/How-to-implement-Transactions-in-Mongoose-&-Node.Js-(Express)
export const initMeta = async (url: string): Promise<IMetaData> => {

  const fmtURL = rmPageFromURLQuery(url)

  const newMeta = await MetadataModel.create({
    name: generateSlug(), 
    url, 
    params: fmtURL.params,
    page: fmtURL.page
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

export const updateMeta = async (meta: IMetaData) => {
  const newMeta = await MetadataModel.findByIdAndUpdate(
    {_id: meta._id},
    {$set: meta},
    {new: true}
  )

  if (!newMeta) throw new Error('failed to update metadata');

  return newMeta;
}