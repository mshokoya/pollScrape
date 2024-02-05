import { Mutex } from 'async-mutex';
import { getDomain } from './helpers';
// import IMAP, { ImapConfig } from 'imap-mailbox';
import { FetchMessageObject, ImapFlow, ImapFlowOptions } from 'imapflow';

// https://dev.to/qaproengineer/extracting-links-from-gmail-emails-using-nodejsimap-and-puppeteer-dec
// https://www.youtube.com/watch?v=-rcRf7yswfM
// https://developers.google.com/oauthplayground/
// https://developers.google.com/oauthplayground/?code=4/0AfJohXn6e_ceCP2wVt96I9mIXiu8p_-lCESO9es-Blb5BkUWzlimOsHAuI3GDdx8304l4w&scope=https://mail.google.com/%20https://www.googleapis.com/auth/gmail.addons.current.action.compose%20https://www.googleapis.com/auth/gmail.addons.current.message.action%20https://www.googleapis.com/auth/gmail.addons.current.message.metadata%20https://www.googleapis.com/auth/gmail.addons.current.message.readonly%20https://www.googleapis.com/auth/gmail.compose%20https://www.googleapis.com/auth/gmail.insert%20https://www.googleapis.com/auth/gmail.labels%20https://www.googleapis.com/auth/gmail.metadata%20https://www.googleapis.com/auth/gmail.modify%20https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/gmail.send%20https://www.googleapis.com/auth/gmail.settings.basic%20https://www.googleapis.com/auth/gmail.settings.sharing
// https://github.com/andris9/xoauth2/blob/168af721b39bcccf8fa380809c426abe8f9092ab/README.md?plain=1#L71
// https://stackoverflow.com/questions/75344054/fails-to-read-gmail-inbox-with-invalid-credentials-failure-when-setting-up-i
// https://stackoverflow.com/questions/71964854/how-to-connect-to-gmail-using-node-js-imapflow
// https://ei.docs.wso2.com/en/latest/micro-integrator/references/connectors/gmail-connector/configuring-gmail-api/

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
  t: NodeJS.Timeout
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

    let lock = await conn.getMailboxLock('INBOX');

    const mails: FetchMessageObject[] = []

    try {
      for await (let message of conn.fetch('1:*', { envelope: true, uid: true })) {
        mails.push(message)
      }
    } finally {
      lock.release();
    }

    return mails
  }

  const watchForNewMail = async (email: string, cb: () => void) => {
    const conn = await getConnection(email)

    const tempCB = (path: string, count: number, prevCount: number) => {
      const newMail = count - prevCount;
      if (newMail < 0) return;
      console.log("NNNNNNEEEEEEEWWWWW EEMMAAAIIILLL EEVVEENNTTT")
      console.log(path)
    }

    conn.on('exists', tempCB)
  }

  const logout = async (email: string) => {
    _closeSession(email)
  }

  const deleteMail = async (conn: ImapFlow) => {}

  const storeConnections = async (conns: ImapFlowOptions[]) => {
    conns.forEach((c) => { mailbox.push(c) })
  }

  const newConnection = async (opts: ImapFlowOptions) => {
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
        .then(() => {
          mailbox.push(opts)
          conns.push({
            conn: client,
            email: opts.auth.user,
            t: _newSession(opts.auth.user),
          })
          return client
        })
    } catch (err: any) {
      throw new Error('Failed to connect to mailbox')
    }
  }

  const getConnection = async (email: string) => {
    return await C_lock.runExclusive(async () => {
      const conn = conns.find((c) => c.email = email)
      if (!conn) {
        const opts = mailbox.find((mb) => mb.auth.user === email)
        if (!opts) throw new Error('Failed to get mailbox, connection not recognised')
        return await newConnection(opts)
      } else {
        clearTimeout(conn.t)
        const ns = _newSession(email);
        conn.t = ns;
        return conn.conn
      }
    })
  }

  const _newSession = (email: string) => {
    const nt = setTimeout(async () => {
      await _closeSession(email)
        .finally(() => {
          clearTimeout(nt)
        })
    }, 20000) // 2mins

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
    watchForNewMail,
    deleteMail,
    getAllMail
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