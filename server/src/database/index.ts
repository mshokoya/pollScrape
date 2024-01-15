import { startSession } from "mongoose";
import { AccountModel, IAccount } from "./models/accounts";
import { IProxy, ProxyModel } from "./models/proxy";
import { parseProxy, rmPageFromURLQuery } from "./util";
import { generateSlug } from "random-word-slugs";
import { RecordsModel } from "./models/records";
import { IMetaData, MetadataModel } from "./models/metadata";
import { v4 as uuidv4 } from 'uuid';

export const addAccountToDB = async (email: string, password: string): Promise<IAccount> => {
  const account = AccountModel.findOne({email})

  if (account !== null) throw new Error('account already exists')
  
  const newAcc = await AccountModel.create({email, password})

  return newAcc
}

export const addCookiesToAccount = async (_id: string, cookies: string[]): Promise<IAccount> => {
  const account = await AccountModel.findOneAndUpdate(
    {_id},
    { '$set': {cookie: JSON.stringify(cookies)} },
    { new: true }
  ).lean() as IAccount;

  if (account === null) throw new Error('failed to save cookies')

  return account
}

export const addProxyToDB = async (p: string): Promise<IProxy | null> => {
  const fmtProxy = parseProxy(p)
  return await ProxyModel.findOneAndUpdate(
    { proxy: p },
    { '$set': fmtProxy },
    { new: true }
  ).lean() as IProxy | null;
}

export const saveScrapeToDB = async (
  accountID: string, 
  cookies: string[], 
  url: string, 
  data: {[key: string]: string}[],
  metadataID: string,
  proxy?: string,
) => {
  const session = await startSession();
  try {
    session.startTransaction();
    const updateOpts = { new: true, session }

    // ACCOUNT UPDATE
    const newAcc = await AccountModel.findOneAndUpdate(
      {_id: accountID},
      { '$set':{
        cookies:  JSON.stringify(cookies),
        proxy,
        lastUsed: new Date()
      }},
      updateOpts
    ).lean();

    console.log('newAcc')
    console.log(newAcc)

    if (!newAcc) throw new Error('failed to update account after scrape, if this continues please contact developer')

    // METADATA UPDATE
    const fmtURL = rmPageFromURLQuery(url)
    const scrapeID = uuidv4()
    
    const newMeta = await MetadataModel.findOneAndUpdate(
      {_id: metadataID}, 
      { '$set' :{
        page: fmtURL.page, 
        "$push": { page: fmtURL.page, scrapeID } // THIS MIGHT NOT WORK FIND ANOTHER WAY TO PUSH
      }}, 
      updateOpts
    ).lean();

    if (!newMeta) throw new Error('failed to update meta after scrape, if this continues please contact developer')

    // RECORD UPDATE
    const fmtData = data.map(() => ({scrapeID, url, page: fmtURL.page, data}))

    const records = await RecordsModel.insertMany(fmtData, updateOpts)
    
    console.log('records')
    console.log(records)

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
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