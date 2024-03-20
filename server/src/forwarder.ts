import superagent from 'superagent';

type Domain = {
  retention_days: number,
  has_regex: boolean,
  has_catchall: boolean,
  has_adult_content_protection: boolean,
  has_phishing_protection: boolean,
  has_executable_protection: boolean,
  has_virus_protection: boolean,
  is_catchall_regex_disabled: boolean,
  plan: string,
  max_recipients_per_alias: number,
  smtp_port: string,
  // members: [ { user: [Object], group: 'admin' } ], ?
  name: string,
  has_mx_record: boolean,
  has_txt_record: boolean,
  verification_record: string,
  has_recipient_verification: boolean,
  has_custom_verification: boolean,
  id: string,
  object: string,
  locale: string,
  created_at: Date,
  updated_at: Date,
  link: string
}

type CreateDomainRes = { ok: boolean, message: string | null, data: {
  has_mx_record: boolean,
  has_txt_record: boolean,
  id: string,
} | null}

type VerifyDomainRes = {ok: boolean, message: string | null, data: {
  has_mx_record: boolean,
  has_txt_record: boolean,
  id: string,
} | null}

type DeleteDomainRes = {ok: boolean, message: string | null, data: Domain | null}

export const Forwarder = () => {
  const Authorization =  `Basic ${Buffer.from(`${process.env.FMTOKEN}:`).toString('base64')}`;

  const addDomain = async (domain:string): Promise<CreateDomainRes> => {
    return await superagent
      .post(process.env.FMCDURI!)
      .set({Authorization})
      .send({catchall: process.env.AUTHEMAIL, domain}) 
      .then((r) => ({ok: r.ok, message: null, data: {
          has_mx_record: r.body.has_mx_record,
          has_txt_record: r.body.has_txt_record,
          id: r.body.id
        }}))
      .catch((err) => {
        return {ok: false, message: null, data: null}
      
      })
  }

  // (FIX) get doomain info too to check if mx or txt records have been updated
  const verifyDomain = async (domain: string):Promise<VerifyDomainRes> => {
    return await superagent
    .get(`${process.env.FMDURI!}/${domain}/verify-records`)
    .set({Authorization})
    .then((r) => ({ ok: true, message: r.message, data: {
        has_mx_record: true,
        has_txt_record: true,
      } 
    }))
    .catch((err) => {
      
      const errRes = {ok: false, message: null, data: null}
      const l = JSON.parse(err.response.text)
      if (l.statusCode === 404) {
        errRes.message = l.message
      } else {
        errRes.message = 'Making changes to your DNS records takes time to propagate throughout the Internet. You may need to wait a few minutes and then try again' as any
      }

      return getDomain(domain)
        .then((r) => ({ ok: false, message: null, data: {
              has_mx_record: r.data.has_mx_record,
              has_txt_record: r.data.has_txt_record,
            }
          })
        )
        .catch(r => ({ok: false, message: errRes.message, date: null}))
    })




  //   const res = await superagent
  //   .get(`${process.env.FMDURI!}/${domain}/verify-records`)
  //   .set({Authorization})
  //   .then((r) => {
  //     console.log(`
      
      
  //     TTTHHEEENNN
      
  //     ${r.body}


  //     aanndd

  //     ${JSON.parse(r.text)}

  //     aann

  //     ${JSON.parse(r.message)}
      

  //     `)
  //     return {
  //       ok: true,
  //       message: null
  //     }
  //   })
  //   .catch((err) => {
  //     const errRes = {ok: false, message: null, data: null}
  //     const l = JSON.parse(err.response.text)
  //     if (l.statusCode === 404) {
  //       errRes.message = l.message
  //     } else {
  //       errRes.message = 'Making changes to your DNS records takes time to propagate throughout the Internet. You may need to wait a few minutes and then try again' as any
  //     }
  //     return errRes
  // })

  //   return res
  }

  const deleteDomain = async (domain: string): Promise<DeleteDomainRes> => {
    return await superagent
      .delete(`${process.env.FMDURI!}/${domain}`)
      .set({Authorization})
      .then( r => ({ok: r.ok, message: null, data: r.body}) )
      .catch(async () => {
        return getDomain(domain)
          .then(() => ({ok: false, message: null, data: null}))
          .catch(r => ({ok: r.ok, message: null, data: r.body}))
      })
  }

  const getDomain = async (domain: string) => {
    return await superagent
      .get(`${process.env.FMDURI!}/${domain}`)
      .set({Authorization})
      .then( r => ({ok: r.ok, message: null, data: r.body}) )
      .catch( r => ({ok: false, message: null, data: null}) )
  }

  return {
    getDomain,
    addDomain,
    verifyDomain,
    deleteDomain,
  }
}

export let forwarder: ReturnType<typeof Forwarder>;

export const initForwarder = () => {
  forwarder = Forwarder()
  return forwarder
}