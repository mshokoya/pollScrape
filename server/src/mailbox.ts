import { Mutex } from 'async-mutex';
import { getDomain } from './helpers';
// import IMAP, { ImapConfig } from 'imap-mailbox';
import { FetchMessageObject, ImapFlow, ImapFlowOptions } from 'imapflow';

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
}

export type MBEventArgs = {
  authEmail: string
  path: string
  count: string
  prevCount: string
}


// (FIX) create and store connection in array and add timeout to auto close conn & remove conn from array
const Mailbox = () => {
  const C_lock = new Mutex();
  let mailbox: ImapFlowOptions[] = []; // get from db
  let conns: C[] = [];


  const getAllMail = async (email: string) => {
    const opts = mailbox.find((mb) => mb.auth.user === email )
    if (!opts) throw new Error('Failed to get mailbox, connection not recognised')
    const conn = await getConnection(email);

    const mails: FetchMessageObject[] = []

    for await (let message of conn.fetch('1:*', { envelope: true, uid: true })) {
      mails.push(message)
    }

    return mails
  }

  const getLatestMessage = async (email: string) => {
    const conn = conns.find((c) => c.email = email)
    // (FIX) is messages come in too fast, might haveto use 'fetch' = https://stackoverflow.com/questions/66489396/how-can-i-get-only-unread-emails-using-imapflow
      if (!conn) throw new Error('Failed to get mailbox, please reconnect')
        // return await newConnection(opts, cb)
    return await conn.conn.fetchOne('*', {uid: true, envelope: true, source: true, flags: true, headers: true, bodyStructure: true,})
  }

  // const watchMailbox = async (email: string, cb: (data: MBEventArgs) => void) => {
  //   // const conn = await getConnection(email)
  //   const conn = conns.find((mb) => mb.email === email)
  //   if (!conn) throw new Error('failed to watch mailbox, conneection not found')
  //   clearTimeout(conn.t)
  //   conn.conn.on('exists', async (data) => { await cb({...data, email}) } )
  // }

  const stopWatchingMailbox = (email: string, cb: (data: MBEventArgs) => void) => {
    const conn = conns.find((mb) => mb.email === email)
    if (!conn) throw new Error('failed to stop watching mailbox, conneection not found')
    conn.t = _newSession(email)
    conn.conn.removeListener('exists', cb)
  }

  const logout = async (email: string) => {
    _closeSession(email)
  }

  const deleteMail = () => {
    return conns
  }

  const storeConnections = async (conns: ImapFlowOptions[]) => {
    conns.forEach((c) => { mailbox.push(c) })
  }

  const newConnection = async (opts: ImapFlowOptions, eventCallback: (data: MBEventArgs) => void) => {
    // check if if conn does not already exist

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
          })

          client.on('exists', async (data: Omit<MBEventArgs, 'email'>) => { 
            await eventCallback({...data, authEmail: opts.auth.user}) 
          })

          return client
        })
    } catch (err: any) {
      throw new Error('Failed to connect to mailbox')
    }
  }

  const getConnection = async (email: string, cb?: (data: MBEventArgs) => void) => {
    return await C_lock.runExclusive(async () => {
      const conn = conns.find((c) => c.email = email)
      if (!conn && cb) {
        const opts = mailbox.find((mb) => mb.auth.user === email)
        if (!opts) throw new Error('Failed to get mailbox, connection not recognised')
        return await newConnection(opts, cb)
      } else if (conn) {
        return conn.conn
      } else {
        throw new Error('failed to establish a connection to mailbox, please try reconnecting')
      }
    })
  }

  const _newSession = (email: string) => {
    const nt = setTimeout(async () => {
      await _closeSession(email)
        .finally(() => {
          clearTimeout(nt)
        })
    }, 1.8e+7) // 1min

    return nt
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
    stopWatchingMailbox,
    getLatestMessage
  }
}

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