import { startSession } from "mongoose";
import { AccountModel, IAccount } from "./models/accounts";
import { IProxy, ProxyModel } from "./models/proxy";
import { parseProxy, rmPageFromURLQuery } from "./util";
import { ApolloDataModel } from "./models/records";
import { ApolloMetadataModel } from "./models/metadata";
import { generateSlug } from "random-word-slugs";

export const addAccountToDB = async (email: string, password: string): Promise<IAccount> => {

  const account = AccountModel.findOne({email})

  if (account === null) throw new Error('account already exists')

  const newAcc = await AccountModel.create({email, password})

  return newAcc
}

export const addCookiesToAccount = async (email: string, cookies: string): Promise<void> => {
  const account = await AccountModel.findOneAndUpdate(
    {email},
    {cookies},
    { upsert: true, new: false }
  ).lean() as IAccount;

  if (account === null) throw new Error('failed to save cookies')
}

export const addProxyToDB = async (p: string): Promise<IProxy> => {

  const proxy = await ProxyModel.findOneAndUpdate(
    { proxy: p },
    { $setOnInsert: parseProxy(p) },
    { new: true }
  ).lean() as IProxy;

  return proxy
}

export const saveScrapeToDB = async (userID: string, cookies: string[], proxy: string, url: string, data: {[key: string]: string}[]) => {
  const session = await startSession();
  try {
    session.startTransaction();
    const updateOpts = {new: true, session, /* upsert: true */ }

    await AccountModel.findOneAndUpdate(
      {_id: userID}, 
      {
        cookies:  JSON.stringify(cookies),
        proxy,
        lastUsed: new Date()
      }, 
      updateOpts
    ).lean();

    const fmtURL = rmPageFromURLQuery(url)

    const apolloData = await ApolloDataModel.findOneAndUpdate(
      {url: fmtURL.url}, 
      {
        'data.page': fmtURL.page,
        'data.fullURL': url,
        'data.data': JSON.stringify(data)
      }, 
      updateOpts
    ).lean();
    
    await ApolloMetadataModel.findOneAndUpdate(
      {url: fmtURL.url}, 
      {
        fullURL: url, 
        page: fmtURL.page, 
        "$push": { "scrapes": apolloData!._id} // THIS MIGHT NOT WORK FIND ANOTHER WAY TO PUSH
      }
      , 
      updateOpts
    ).lean();

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

    await ApolloMetadataModel.findOneAndUpdate(
      {url: fmtURL.url}, 
      {
        '$setOnInsert': {
          name: generateSlug(), 
          fullURL: url
        }
      }, 
      updateOpts
    ).lean();

    await ApolloDataModel.findOneAndUpdate(
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