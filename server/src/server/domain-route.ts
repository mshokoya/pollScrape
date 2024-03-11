import { Express } from 'express';
import { DomainModel } from '../database/models/domain';
import { forwarder } from '../forwarder';
import isValidDomain from 'is-valid-domain'
import { prompt } from '../prompt';


export const domainRoutes = (app: Express) => {
  // (NEW)
  app.post('/domain', async (req, res) => {
    console.log('Add new domain')

    Promise.all([
      prompt.askQuestion('what is your name', ['michael', 'oj', 'cynthia'], 1),
      prompt.askQuestion('whos king', ['mum', 'dad', 'mee'], 2),
      prompt.askQuestion('whos m2', ['mum', 'dad', 'mee'], 2)
    ])
    

    console.log('WE ARE IN THE AFTER')

    // try {
    //   const email =  req.body.email || 'mayo_s@hotmail.co.uk' // (FIX) get account email from somewhere
    //   const domain = req.body.domain;
    //   if (!domain) throw new Error('Failed to add domain, invalid domain');

    //   if (!isValidDomain(domain)) throw new Error('Failed to add domain, invalid domain') // (FIX) find lib to do this better

    //   const doesExist = await DomainModel.findOne({domain}).lean();
    //   if (doesExist) throw new Error('domain already exists')

    //   const isOK = await forwarder.addDomain(domain, email);
    //   if (!isOK) throw new Error('failed to save domain in forwarder');

    //   const newDomain = await DomainModel.create({domain, authEmail: email})

    //   res.json({ok: true, message: null, data: newDomain});
    // } catch (err: any) {
    //   res.json({ok: false, message: err.message, data: err});
    // }
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





// import { observer, useSelector } from '@legendapp/state/react';
// import { answerPromptEvent} from '../core/io/prompt';
// import {PromptState, promptState, startPromptCountdown} from '../core/state/prompt';
// import { Observable, computed } from '@legendapp/state';

// type Props = {
//   p: Observable<PromptState[]>
// }

// export const PromptPopup = observer(({p}: Props ) => {


//   const answerPrompt = (id: string, idx: any) => {
//     answerPromptEvent(id, idx)
//   }

//   const comps = p.map((p1, idx)=> {
//     if (idx === 0) console.log('NNNEEEWWWW IIDDXXXX')
//     return (
//       <div key={idx}>
//         <div className='text-center border-b-2 border-cyan-600 mb-2'> {p1.get().question}</div>
//           {
//             p1.get().choices.map((p2, idx2) => (<div key={idx2} onClick={() => { console.log(p.get()); answerPrompt(p1.qid.get(), idx2)}  }>{p2}</div>))
//           }
//       </div>
//     )
//   })

  
//   return (
//     <div className="flex items-center justify-center absolute top-0 left-0 right-0 bottom-0 " style={{background: "rgba(0,0,0,.70)"}} >
//       <div className="relative w-[30%] h-[30%] z-20 border-cyan-600 border-2 bg-black flex flex-col " onClick={e => e.stopPropagation()}>
//         {comps}
//         <button onClick={() => {console.log(p.get())}}>view state</button>
//         <button onClick={() => {console.log(p[0].get())}}>view position 0</button>
//         <button onClick={() => {console.log(p[1].get())}}>view position 0</button>
//       </div>
//     </div>
//   )
// })