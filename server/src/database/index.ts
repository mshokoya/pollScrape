import { startSession } from "mongoose";
import { AccountModel, IAccount } from "./models/accounts";
import { IProxy, ProxyModel } from "./models/proxy";
import { parseProxy, rmPageFromURLQuery } from "./util";
import { generateSlug } from "random-word-slugs";
import { RecordsModel } from "./models/records";
import { MetadataModel } from "./models/metadata";
import { v4 as uuidv4 } from 'uuid';

export const addAccountToDB = async (email: string, password: string): Promise<IAccount> => {
  const account = AccountModel.findOne({email})

  if (account !== null) throw new Error('account already exists')
  
  const newAcc = await AccountModel.create({email, password})

  return newAcc
}

export const addCookiesToAccount = async (_id: string, cookie: string[]): Promise<IAccount> => {
  const account = await AccountModel.findOneAndUpdate(
    {_id},
    { '$set': {cookies: JSON.stringify(cookie)} },
    { new: true }
  ).lean() as IAccount;

  if (account === null) throw new Error('failed to save cookies')

  return account
}

export const addProxyToDB = async (p: string): Promise<IProxy> => {

  const proxy = await ProxyModel.findOneAndUpdate(
    { proxy: p },
    { $setOnInsert: parseProxy(p) },
    { new: true }
  ).lean() as IProxy;

  return proxy
}

export const saveScrapeToDB = async (
  accountID: string, 
  cookies: string[], 
  proxy: string, 
  url: string, 
  data: {[key: string]: string}[],
  metadataID: string,
) => {
  const session = await startSession();
  try {
    session.startTransaction();
    const updateOpts = { session, upsert: true }

    // ACCOUNT UPDATE
    const acc = await AccountModel.findOneAndUpdate(
      {_id: accountID},
      {
        cookies:  JSON.stringify(cookies),
        proxy,
        lastUsed: new Date()
      },
      updateOpts
    ).lean();

    console.log('acc')
    console.log(acc)

    // METADATA UPDATE
    const fmtURL = rmPageFromURLQuery(url)
    const scrapeID = uuidv4()
    
    const meta = await MetadataModel.findOneAndUpdate(
      {_id: metadataID}, 
      {
        page: fmtURL.page, 
        "$push": { page: parseInt(fmtURL.page), scrapeID } // THIS MIGHT NOT WORK FIND ANOTHER WAY TO PUSH
      }
      , 
      updateOpts
    ).lean();

    console.log('meta')
    console.log(meta)

    // RECORD UPDATE
    const fmtData = data.map(() => ({scrapeID, url, page: fmtURL.page, data}))

    const apolloData = await RecordsModel.insertMany(fmtData, updateOpts)

    console.log('apolloData')
    console.log(apolloData)
    

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
  }
  await session.endSession();

}

// https://www.ultimateakash.com/blog-details/IiwzQGAKYAo=/How-to-implement-Transactions-in-Mongoose-&-Node.Js-(Express)
export const initApolloSkeletonInDB = async (url: string) => {
  const session = await startSession();
  let apolloMetaData;


  try {
    session.startTransaction();
    const updateOpts = {new: true, session, upsert: true};

    const fmtURL = rmPageFromURLQuery(url)

    await MetadataModel.findOneAndUpdate(
      {url: fmtURL.url}, 
      {
        '$setOnInsert': {
          name: generateSlug(), 
          fullURL: url
        }
      }, 
      updateOpts
    ).lean();

    await RecordsModel.findOneAndUpdate(
      {url: fmtURL.url}, 
      {
        '$setOnInsert': {
          'data.page': fmtURL.page,
          'data.fullURL': url,
        }
      }, 
      updateOpts
    ).lean();

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();

  }
  await session.endSession();
}

export const getAllApolloAccounts = async (): Promise<IAccount[]> => {
  return await AccountModel.find({}).lean() as IAccount[]
}