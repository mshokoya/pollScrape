// Actions for scraper
import {AccountModel, ApolloMetadataModel, ApolloDataModel, ProxyModel, IAccount, IProxy} from './database';
import {startSession} from 'mongoose';
import {rmPageFromURLQuery, verifyProxy, shuffleArray} from './util';
import { generateSlug } from "random-word-slugs";

// https://www.ultimateakash.com/blog-details/IiwzQGAKYAo=/How-to-implement-Transactions-in-Mongoose-&-Node.Js-(Express)

export const savePageScrapeToDB = async (userID: string, cookies: string[], proxy: string, url: string, data: {[key: string]: string}[]) => {
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

export const selectProxy = async (account: IAccount, allAccounts: IAccount[]): Promise<string> => {
  let doesProxyStillWork = await verifyProxy(account.proxy)

  if (doesProxyStillWork) return account.proxy;

  const allProxiesInUse = allAccounts
    .filter((u) => u.proxy === account.proxy) // remove user from list
    .map((u) => u.proxy) //retrun list of proxies

  const allProxiesNotInUse = shuffleArray(
    (ProxyModel.find({}).lean() as any)
      .filter((p: IProxy) => !allProxiesInUse.includes(p.proxy))
  )
  
  for (let proxy of allProxiesNotInUse) {
    doesProxyStillWork = await verifyProxy(proxy)
    if (doesProxyStillWork) return proxy;
  }

  throw new Error('[PROXY_ERROR]: No Proxies Work: please add new proxies')
}