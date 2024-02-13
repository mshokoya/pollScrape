import { Express } from 'express';
import { DomainModel } from '../database/models/domain';
import { forwarder } from '../forwarder';
import { delay } from '../scraper/util';

export const domainRoutes = (app: Express) => {
  // (NEW)
  app.post('/domain', async (req, res) => {
    console.log('Add new domain')

    try {
      const email =  req.body.email || 'testemail@tessa.com' // (FIX) get account email from somewhere
      const domain = req.body.domain;
      if (!domain) throw new Error('Failed to add domain, valid domain not provided');

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
        ? await DomainModel.findOneAndUpdate({domain}, {'$set': {VerifyMessage: verifyRes.message || ''}}, {new: true})
        : await DomainModel.findOneAndUpdate({domain}, {'$set': {VerifyMessage: verifyRes.message, MXRecords: true, TXTRecords: true, verified: true}}, {new: true})

      res.json({ok: true, message: null, data: newDomain});
    } catch (err: any) {
      res.json({ok: false, message: err.message, data: err});
    }
  })

  app.delete('/domain/:domain', async (req, res) => {
    console.log('delete domain')
    try{
      const domain = req.params.domain
      if (!domain) throw new Error('Failed to delete doamin, valid domain not provided')

      const isVerified = await forwarder.deleteDomain(domain)

      // (FIX) could be a problem
      if (isVerified) {
        const deleteCount = await DomainModel.deleteOne({domain})
        if (deleteCount.deletedCount < 1) throw new Error('failed to delete domain, try again')
      }

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
}