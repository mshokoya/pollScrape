import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import bodyParser from 'body-parser'
import { createServer } from 'node:http'
import { getRecord, getRecords, recordRoutes } from './server/record-routes'
import { addProxy, getProxies, proxyRoutes } from './server/proxy-routes'
import {
  accountRoutes,
  addAccount,
  checkAccount,
  confirmAccount,
  deleteAccount,
  demine,
  getAccounts,
  loginAuto,
  loginManually,
  updateAcc,
  upgradeAutomatically,
  upgradeManually
} from './server/account-routes'
import {
  deleteMetadata,
  getMetadatas,
  metadataRoutes,
  updateMetadata
} from './server/metadata-route'
import { scrapeLeads, scrapeRoutes } from './server/scrape-routes'
import { initTaskQueue } from './task_queue'
import { initSocketIO } from './websockets'
import { initMailBox } from './mailbox'
import { initForwarder } from './forwarder'
import { addDomain, deleteDomain, domainRoutes, getDomains } from './server/domain-route'
import { initCache } from './cache'
import { initPrompt } from './prompt'
import { IAccount } from './database/models/accounts'
import { IMetaData } from './database/models/metadata'

const app = express()
const server = createServer(app)
const port = 4000

//  free proxies
// https://proxyscrape.com/free-proxy-list
// https://geonode.com/free-proxy-list

export const init = async (): Promise<void> => {
  mongoose.connect(process.env.MONGOURI!).then(async () => {
    console.log('Mongoose started')

    initCache()
    console.log('Cache started')

    initSocketIO(server)
    console.log('SocketIO started')

    initPrompt()
    console.log('Prompt started')

    initTaskQueue()
    console.log('TaskQueue started')

    initForwarder()
    console.log('Forwarder started')

    await initMailBox()
    console.log('Mailbox started')

    server.listen(port, () => {
      console.log(`Connected to server on port ${port}`)
    })
  })
}

// Accounts
export const WconfirmAccount = async (id: string) =>
  await init().then(async () => await confirmAccount(id))
export const WupgradeManually = async (id: string) =>
  await init().then(async () => await upgradeManually(id))
export const WupgradeAutomatically = async (id: string) =>
  await init().then(async () => await upgradeAutomatically(id))
export const WcheckAccount = async (id: string) =>
  await init().then(async () => await checkAccount(id))
export const WdeleteAccount = async (id: string) =>
  await init().then(async () => await deleteAccount(id))
export const WloginAuto = async (id: string) => await init().then(async () => await loginAuto(id))
export const Wdemine = async (id: string) => await init().then(async () => await demine(id))
export const WloginManually = async (id: string) =>
  await init().then(async () => await loginManually(id))
export const WupdateAcc = async (id: string, account: IAccount) =>
  await init().then(async () => await updateAcc(id, account))
export const WgetAccounts = async () => await init().then(async () => await getAccounts())
export const WaddAccount = async (
  email,
  addType,
  selectedDomain,
  password,
  recoveryEmail,
  domainEmail
) =>
  await init().then(
    async () =>
      await addAccount({
        emaill: email,
        addTypee: addType,
        selectedDomainn: selectedDomain,
        passwordd: password,
        recoveryEmaill: recoveryEmail,
        domainEmaill: domainEmail
      })
  )

// Domain
export const WaddDomain = async (domain: string) =>
  await init().then(async () => await addDomain(domain))
export const Wverify = async (domain: string) =>
  await init().then(async () => await confirmAccount(domain))
export const WdeleteDomain = async (id: string) =>
  await init().then(async () => await deleteDomain(id))
export const WgetDomains = async () => await init().then(async () => await getDomains())

// metaData
export const WgetMetadatas = async () => await init().then(async () => await getMetadatas())
export const WdeleteMetadata = async (id: string) =>
  await init().then(async () => await deleteMetadata(id))
export const WupdateMetadata = async (meta: IMetaData) =>
  await init().then(async () => await updateMetadata(meta))

// proxy
export const WgetProxies = async () => await init().then(async () => await getProxies())
export const WaddProxy = async (url: string, proxy: string) =>
  await init().then(async () => await addProxy(url, proxy))

// record
export const WgetRecord = async (id: string) => await init().then(async () => await getRecord(id))
export const WgetRecords = async () => await init().then(async () => await getRecords())

// scrape
export const Wscrape = async (id: string, proxy: boolean, url: string) => await init().then(async () => await scrapeLeads(id, proxy, url))
