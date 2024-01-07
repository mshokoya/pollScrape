import {AccountModel, IAccount, ProxyModel} from './database';
import {parseProxy} from './util';

export const addAccountToDB = async (email: string, password: string): Promise<IAccount> => {
  const data = {'apollo.email': email, 'apollo.password': password}
  
  return await AccountModel.findOneAndUpdate(
    { 'apollo.email': email },
    { $setOnInsert: data },
    { upsert: true, new: false }
  ).lean() as IAccount
}

export const addProxyToDB = async (proxy: string) => {
  await ProxyModel.create(parseProxy(proxy));
}
