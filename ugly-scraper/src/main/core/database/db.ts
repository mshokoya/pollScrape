import { appSchema, tableSchema } from '@nozbe/watermelondb'
import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter  from '@nozbe/watermelondb/adapters/sqlite'
import Account from './models/accounts'
import Domain from './models/domain'
import MetaData from './models/metadata'
import Proxy from './models/proxy'
import Record from './models/records'

// export const sm = schemaMigrations({
//   migrations: [
//     // We'll add migration definitions here later
//   ]
// })

export const schema = appSchema({
  version: 1,
  tables: [
    // tableSchema({
    //   name: 'account',
    //   columns: [
    //     { name: 'domain', type: 'string' },
    //     { name: 'accountType', type: 'string' },
    //     { name: 'trialType', type: 'string' },
    //     { name: 'suspended', type: 'boolean' },
    //     { name: 'loginType', type: 'string' },
    //     { name: 'domainEmail', type: 'string' },
    //     { name: 'verified', type: 'string' },
    //     { name: 'email', type: 'string' },
    //     { name: 'password', type: 'string' },
    //     { name: 'cookie', type: 'string' },
    //     { name: 'apolloPassword', type: 'string' },
    //     { name: 'proxy', type: 'string' },
    //     { name: 'emailCreditsUsed', type: 'number' },
    //     { name: 'emailCreditsLimit', type: 'number' },
    //     { name: 'renewalDateTime', type: 'number' },
    //     { name: 'renewalStartDate', type: 'number' },
    //     { name: 'renewalEndDate', type: 'number' },
    //     { name: 'trialDaysLeft', type: 'number' },
    //     { name: 'history', type: 'string' }
    //   ]
    // }),
    // tableSchema({
    //   name: 'domain',
    //   columns: [
    //     { name: 'domain', type: 'string' },
    //     { name: 'authEmail', type: 'string' },
    //     { name: 'authPassword', type: 'string' },
    //     { name: 'verified', type: 'boolean' },
    //     { name: 'MXRecords', type: 'boolean' },
    //     { name: 'TXTRecords', type: 'boolean' },
    //     { name: 'VerifyMessage', type: 'string' }
    //   ]
    // }),
    // tableSchema({
    //   name: 'metadata',
    //   columns: [
    //     { name: 'url', type: 'string' },
    //     { name: 'params', type: 'string' },
    //     { name: 'name', type: 'string' },
    //     { name: 'accounts', type: 'string' }, // IAccount
    //     { name: 'scrapes', type: 'string' } // [{scrapeID: "", listName: ''}] - is used in Records Model (scrape)
    //   ]
    // }),
    // tableSchema({
    //   name: 'proxy',
    //   columns: [
    //     { name: 'proxy', type: 'string' },
    //     { name: 'protocol', type: 'string' },
    //     { name: 'host', type: 'string' },
    //     { name: 'port', type: 'string' }
    //   ]
    // }),
    // tableSchema({
    //   name: 'record',
    //   columns: [
    //     { name: 'scrapeID', type: 'string' },
    //     { name: 'url', type: 'string' },
    //     { name: 'data', type: 'string' }
    //   ]
    // })
  ]
})

const adapter = new SQLiteAdapter({
  dbName: 'ugly.sqlite',
  schema
  // onSetUpError: error => {
  //   // Database failed to load -- offer the user to reload the app or log out
  // }
})

export const database: Database = new Database({
  adapter,
  modelClasses: [Account, Domain, MetaData, Proxy, Record]
})
