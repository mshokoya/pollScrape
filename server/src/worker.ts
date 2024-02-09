// require('ts-node').register({
//   "compilerOptions": {
//     "target": "es2016",
//     "esModuleInterop": true,
//     "module": "commonjs",
//     "rootDir": ".",
//   }
// });
import { AccountModel } from "./database/models/accounts"
import {worker} from 'workerpool';
import { IAccount } from "./database/models/accounts";
import { mailbox } from "./mailbox";
import { newMailEvent, signupForApollo } from "./scraper";
import { getBrowserCookies } from "./scraper/util";
import { updateAccount } from "./database";
import { scraper } from "./scraper/scraper";
import {resolve} from 'path'


export const filepath = resolve(__filename);

export const createApolloAccountRoute = async (account: IAccount) => {
  console.log(" app.post('/account', async (req, res) => { ")


  console.log(AccountModel)
  // const accountExists = !['gmail', 'outlook', 'hotmail'].includes(account.domainEmail)
  //   ? await AccountModel.findOne({domainEmail: account.domainEmail}).lean()
  //   : await AccountModel.findOne({email: account.email}).lean();

  // if (accountExists) throw new Error('Failed to create new account, account already exists')

  // // (FIX) better error handling (show user correct error)
  // await mailbox.newConnection({
  //   auth: {
  //     user: account.email,
  //     pass: account.password
  //   }
  // }, 
  // newMailEvent
  //   .then(async () => {
  //     console.log(`
      
  //       THE CALLBACK WORKS
      
  //     `)
  //     const cookie = await getBrowserCookies()
  //     await updateAccount({email: account.email}, {cookie: JSON.stringify(cookie)})
  //   })
  // )

  // // (FIX) make it work with taskqueue
  // if (!scraper.browser()) await scraper.launchBrowser()

  // await signupForApollo(account)

  // // (FIX) indicate that account exists on db but not verified via email or apollo
  // await AccountModel.create(account);
}


worker({
  createApolloAccountRoute
})