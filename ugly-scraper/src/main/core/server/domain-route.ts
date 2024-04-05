import { Express } from 'express'
import { DomainModel_ } from '../database/models/domain'
import { forwarder } from '../forwarder'
import isValidDomain from 'is-valid-domain'

export const domainRoutes = (app: Express) => {
  // (NEW)
  app.post('/domain', async (req, res) => {
    res.json(await addDomain(req.body.domain))
  })

  // (NEW)
  app.get('/domain/verify/:domain', async (req, res) => {
    res.json(await verifyDomain(req.params.domain))
  })

  app.delete('/domain/:domain', async (req, res) => {
    res.json(await deleteDomain(req.params.domain))
  })

  app.get('/domain', async (req, res) => {
    res.json(await getDomains())
  })
}

export const addDomain = async (domain: string) => {
  console.log('Add new domain')

  try {
    if (!domain) throw new Error('Failed to add domain, invalid domain')

    if (!isValidDomain(domain)) throw new Error('Failed to add domain, invalid domain') // (FIX) find lib to do this better

    const ad = await forwarder.addDomain(domain)
    if (!ad.ok) throw new Error('failed to save domain in forwarder')

    const doesExist = await DomainModel_.findOne({ domain })
    if (doesExist) throw new Error('domain already exists')

    const newDomain = await DomainModel_.create({ domain })

    return { ok: true, message: null, data: newDomain }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

export const verifyDomain = async (domain: string) => {
  console.log('verify domain')
  try {
    if (!domain) throw new Error('Failed to verify doamin, valid domain not provided')

    const vr = await forwarder.verifyDomain(domain)

    console.log('verifyRes')
    console.log(vr)

    const newDomain = !vr.ok
      ? await DomainModel_.findOneAndUpdate(
          { domain },
          {
            VerifyMessage: vr.message || '',
            MXRecords: vr.data?.has_mx_record,
            TXTRecords: vr.data?.has_txt_record,
            verified: false
          }
        )
      : await DomainModel_.findOneAndUpdate(
          { domain },
          {
            VerifyMessage: vr.message,
            MXRecords: vr.data?.has_mx_record,
            TXTRecords: vr.data?.has_txt_record,
            verified: true
          }
        )

    return { ok: vr.ok, message: null, data: newDomain }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

export const deleteDomain = async (domain: string) => {
  console.log('delete domain')
  try {
    if (!domain) throw new Error('Failed to delete doamin, valid domain not provided')

    const delRes = await forwarder.deleteDomain(domain)

    // (FIX) could be a problem
    if (delRes.ok) {
      const deleteCount = await DomainModel_.findOneAndDelete({ domain })
      if (!deleteCount) throw new Error('failed to delete domain, try again')
    }

    return { ok: delRes.ok, message: null, data: null }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

export const getDomains = async () => {
  console.log('get domains')
  try {
    const domains = await DomainModel_.findAll()

    return { ok: true, message: null, data: domains }
  } catch (err: any) {
    return { ok: false, message: err.message, data: err }
  }
}

// app.post('/domain', async (req, res) => {
//   console.log('Add new domain')

//   Promise.all([
//     await prompt.askQuestion('what is your name', ['michael', 'oj', 'cynthia'], 1),
//     await prompt.askQuestion('whos king', ['mum', 'dad', 'mee'], 2),
//     await prompt.askQuestion('whos m2', ['mum', 'dad', 'mee'], 2)
//   ])

//   console.log('WE ARE IN THE AFTER')
// })
