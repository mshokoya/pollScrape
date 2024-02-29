import { Mutex } from 'async-mutex';
import { getDomain } from './helpers';
// import IMAP, { ImapConfig } from 'imap-mailbox';
import { FetchMessageObject, ImapFlow, ImapFlowOptions } from 'imapflow';
import { IAccount } from './database/models/accounts';

// https://dev.to/qaproengineer/extracting-links-from-gmail-emails-using-nodejsimap-and-puppeteer-dec

// const config = {
//   host: 'imap.server.domain',
//   port: 993,
//   auth: {
//       user: 'username@server.domain',
//       pass: 'password',
//   }
//   logger: false,
//   logging: true,
// }

type C = {
  conn: ImapFlow,
  email: string,
  t?: NodeJS.Timeout
  u: number
}

export type MBEventArgs = {
  authEmail: string
  path: string
  count: string
  prevCount: string
}


// (FIX) what is connection is started without event then later on events are needed
// (FIX) create and store connection in array and add timeout to auto close conn & remove conn from array
const Mailbox = () => {
  const C_lock = new Mutex();
  let mailbox: ImapFlowOptions[] = []; // get from db
  let conns: C[] = [];


  const getAllMail = async (email: string) => {
    const opts = mailbox.find((mb) => mb.auth.user === email );
    if (!opts) throw new Error('Failed to get mailbox, connection not recognised');
    const conn = await getConnection(opts);

    const mails: FetchMessageObject[] = []

    for await (let message of conn.fetch('1:*', { uid: true, envelope: true, source: true })) {
      mails.push(message)
    }

    return mails
  }

  const getLatestMessage = async (email: string) => {
    const opts = mailbox.find((mb) => mb.auth.user === email );
    if (!opts) throw new Error('Failed to get mailbox, connection not recognised');
    const conn = await getConnection(opts);
    // (FIX) is messages come in too fast, might haveto use 'fetch' = https://stackoverflow.com/questions/66489396/how-can-i-get-only-unread-emails-using-imapflow
    // if (!conn) throw new Error('Failed to get mailbox, please reconnect')
      
    return await conn.fetchOne('*', {envelope: true, source: true})
  }


  const logout = async (email: string) => {
    _closeSession(email)
  }

  const findMail = async(email: string) => {
    const opts = mailbox.find((mb) => mb.auth.user === email );
    if (!opts) throw new Error('failed to delete mail, connection not recognised')
    const conn = await getConnection(opts)
    
    conn.fetchOne('*', )

  }

  const deleteMailByID = async (email: string, id: string) => {
    const opts = mailbox.find((mb) => mb.auth.user === email );
    if (!opts) throw new Error('failed to delete mail, connection not recognised')
    const conn = await getConnection(opts)
    return await conn.messageDelete(id, {uid: true})
  }

  const storeConnections = async (opts: ImapFlowOptions[]) => {
    opts.forEach((c) => { mailbox.push(c) })
  }

  const newConnection = async (opts: ImapFlowOptions, eventCallback?: (data: MBEventArgs) => Promise<void>) => {

    if (!opts.auth.user) throw new Error('failed to login, please provide email')
    if (!opts.auth.pass) throw new Error('failed to login, please provide password')

    const client = new ImapFlow({
      ...opts, 
      port: opts.port || 993,
      secure: true,
      host: opts.host || findIMAP(opts.auth.user),
    } as ImapFlowOptions)

    try {
      return await client.connect()
        .then(async () => {
          await client.mailboxOpen(['INBOX'])

          // might not be needed
          const idx = mailbox.findIndex((o) => o.auth.user === opts.auth.user)
          idx === -1 
            ? mailbox.push(opts)
            : mailbox.splice(idx,1, opts)

          conns.push({
            conn: client,
            email: opts.auth.user,
            u: 1
          })

          if (eventCallback) {
            client.on('exists', async (data: Omit<MBEventArgs, 'email'>) => { 
              await eventCallback({...data, authEmail: opts.auth.user}) 
            })
          }

          return client
        })
    } catch (err: any) {
      throw new Error('Failed to connect to mailbox')
    }
  }

  const getConnection = async (authDeets: ImapFlowOptions, cb?: (data: MBEventArgs) => Promise<void>) => {
    return await C_lock.runExclusive(async () => {
      const opt = mailbox.find((mb) => mb.auth.user === authDeets.auth.user)
      if (!opt) mailbox.push(authDeets)
      const conn = conns.find((c) => c.email = authDeets.auth.user)
      if (!conn) {
        return await newConnection(authDeets, cb)
      } else{
        conn.u++
        return conn.conn
      }
    })
  }

  // (FIX) check if works
  const relinquishConnection = async (email: string) => {
    await C_lock.runExclusive(async () => {
      const mailboxConnection = conns.find((c) => c.email = email)
      if (!mailboxConnection) return
      if (mailboxConnection.u === 1) {
        _closeSession(email)
      } else {
        mailboxConnection.u--
      }
    })
  }

  const _closeSession = async (email: string) => {
    return C_lock.runExclusive(async () => {
      const c_idx = conns.findIndex((c) => c.email = email) // check if works
      if (c_idx === -1) return;
      const c = conns.splice(c_idx, 1)[0]
      await c.conn.logout()
    })
  }

  return {
    newConnection,
    getConnection,
    storeConnections,
    logout,
    deleteMail,
    getAllMail,
    getLatestMessage,
    relinquishConnection
  }
}

export const accountToMailbox = (account: IAccount): ImapFlowOptions => {
  return {
    auth: {
      user: account.email,
      pass: account.password
    },
    port: 993,
    secure: true,
    host: findIMAP(account.email),
  }
}

// auth: {
//   user: string;
//   pass?: string;
//   accessToken?: string;
// }

const findIMAP = (email: string) => {
  switch(getDomain(email)) {
    case 'gmail':
      return 'imap.gmail.com'
    case 'hotmail':
    case 'outlook':
      return 'outlook.office365.com'
    default:
      throw new Error('domain not supported, please provide imap server e,g gmail = imap.gmail.com')
  }
}

export let mailbox: ReturnType<typeof Mailbox>

export const initMailBox = () => {
  mailbox = Mailbox()
  return mailbox
}