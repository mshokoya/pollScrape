import {AccountModel, ProxyModel} from './database';
import {parseProxy} from './util';

export const addAccountToDB = async (email, password) => {
  await AccountModel.create({ 'apollo.email': email, 'apollo.password': password });
}

export const addProxyToDB = async (proxy) => {
  await ProxyModel.create(parseProxy(proxy))
}
