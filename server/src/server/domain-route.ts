import { Express } from 'express';
import { DomainModel } from '../database/models/domain';
import { Forwarder, forwarder } from '../forwarder';
import isValidDomain from 'is-valid-domain'
import { prompt } from '../prompt';


export const domainRoutes = (app: Express) => {
  // (NEW)
  app.post('/domain', async (req, res) => {
    console.log('Add new domain')

    try {
      const email =  req.body.email || 'mayo_s@hotmail.co.uk' // (FIX) get account email from somewhere
      const domain = req.body.domain;
      if (!domain) throw new Error('Failed to add domain, invalid domain');

      if (!isValidDomain(domain)) throw new Error('Failed to add domain, invalid domain') // (FIX) find lib to do this better

      const doesExist = await DomainModel.findOne({domain}).lean();
      if (doesExist) throw new Error('domain already exists')

      const isOK = await forwarder.addDomain(domain, email);
      if (!isOK) throw new Error('failed to save domain in forwarder');

      const newDomain = await DomainModel.create({domain, authEmail: email})

      res.json({ok: true, message: null, data: newDomain});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  })

  // (NEW)
  app.get('/domain/verify/:domain', async (req, res) => {
    console.log('verify domain')
    try {
      const domain = req.params.domain
      if (!domain) throw new Error('Failed to verify doamin, valid domain not provided')

      const verifyRes = await forwarder.verifyDomain(domain)

      const newDomain = !verifyRes.ok
        ? await DomainModel.findOneAndUpdate({domain}, {'$set': {VerifyMessage: verifyRes.message || '', verified: false}}, {new: true})
        : await DomainModel.findOneAndUpdate({domain}, {'$set': {VerifyMessage: verifyRes.message, MXRecords: true, TXTRecords: true, verified: true}}, {new: true})

      res.json({ok: verifyRes.ok, message: null, data: newDomain});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  })

  app.delete('/domain/:domain', async (req, res) => {
    console.log('delete domain')
    try{
      const domain = req.params.domain
      if (!domain) throw new Error('Failed to delete doamin, valid domain not provided')

      const delRes = await forwarder.deleteDomain(domain)

      console.log(delRes)

      // (FIX) could be a problem
      if (delRes.ok) {
        const deleteCount = await DomainModel.deleteOne({domain})
        if (deleteCount.deletedCount < 1) throw new Error('failed to delete domain, try again')
      }

      res.json({ok: delRes.ok, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});

    }
  })

  app.post('/domain/tess', async (req, res) => {
    console.log('geta domains')
    console.log(req.body.domain)
    try{
      if (!req.body.domain) throw new Error('no dd')
      const r = await forwarder.getDomain(req.body.domain)
      console.log('getsss domain')
      console.log(r)

      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  })

  app.get('/domain', async (req, res) => {
    console.log('get domains')
    try{
      const domains = await DomainModel.find({}).lean()

      res.json({ok: true, message: null, data: domains});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  })

  // (FIX) this route is used to make sure domains in DB match domain is forwarder (run on startup)
  app.get('/domain/lineup', async (req, res) => {
    console.log('lineup')
    try{
      res.json({ok: true, message: null, data: null});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  })

  app.get('/domain/accounts', async (req, res) => {
    
  })
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