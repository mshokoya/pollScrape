import {AccountModel, ProxyModel} from './database';
import {parseProxy} from './util';

export const addAccountToDB = async (email: string, password: string) => {
  await AccountModel.create({ 'apollo.email': email, 'apollo.password': password });
}

export const addProxyToDB = async (proxy: string) => {
  await ProxyModel.create(parseProxy(proxy))
}
