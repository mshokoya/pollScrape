import {AccountModel, IAccount, IProxy, ProxyModel} from './database';
import {parseProxy} from './util';

export const addAccountToDB = async (email: string, password: string): Promise<IAccount> => {
  const data = {'apollo.email': email, 'apollo.password': password}

  const accounts = await AccountModel.findOneAndUpdate(
    { 'apollo.email': email },
    { $setOnInsert: data },
    { upsert: false, new: true }
  ).lean() as IAccount;

  if (accounts === null) throw new Error('account already exists') 

  return accounts
}

export const addProxyToDB = async (proxy: string): Promise<IProxy> => {
  await ProxyModel.create(parseProxy(proxy));
  const proxies = await ProxyModel.findOneAndUpdate(
    { proxy },
    { $setOnInsert: parseProxy(proxy) },
    { upsert: false, new: true }
  ).lean() as IProxy;

  if (proxies === null) throw new Error('proxy already exists') 

  return proxies
}
