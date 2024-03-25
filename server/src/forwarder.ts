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

type CreateDomainRes = {
  has_mx_record: boolean,
  has_txt_record: boolean,
  id: string,
}


type VerifyDomainRes = {ok: boolean, message: string}

type DeleteDomainRes = {ok: boolean, message: string | null, data: Domain | null}

export const Forwarder = () => {
  const Authorization =  `Basic ${Buffer.from(`${process.env.FMTOKEN}:`).toString('base64')}`;

  const addDomain = async (domain:string, forwardToEmail: string): Promise<CreateDomainRes> => {

    const res = await superagent
      .post(process.env.FMCDURI!)
      .set({Authorization})
      .send({catchall: forwardToEmail, domain}) 
      .then((data) => ({
          has_mx_record: data.body.has_mx_record,
          has_txt_record: data.body.has_txt_record,
          id: data.body.id
        })
      )
    return res
  }

  // (FIX) get doomain info too to check if mx or txt records have been updated
  const verifyDomain = async (domain: string):Promise<VerifyDomainRes> => {
    const res = await superagent
    .get(`${process.env.FMDURI!}/${domain}/verify-records`)
    .set({Authorization})
    .then((err) => {
      console.log(`
      
      
      TTTHHEEENNN
      
      ${err}
      

      `)
      return {
        ok: true,
        message: "tfghj"
      }
    })
    .catch((err) => ({
      ok: false,
      message: JSON.parse(err.response.text).message.replace(`\nPlease ensure you do not have any typos and have both unique records added (e.g. make sure both records aren't the same). Read our FAQ [https://forwardemail.net/faq?domain=${domain}] for detailed instructions.\n`, '')
    }))

    return res
  }

  const deleteDomain = async (domain: string): Promise<DeleteDomainRes> => {
    const res = await superagent
      .delete(`${process.env.FMDURI!}/${domain}`)
      .set({Authorization})
      .then( r => ({ok: r.ok, message: null, data: r.body}) )
      .catch(async () => {
        return getDomain(domain)
          .then(() => ({ok: false, message: null, data: null}))
          .catch(r => ({ok: r.ok, message: null, data: r.body}))
      })

    return res
  }

  const getDomain = async (domain: string) => {
    console.log('in get domain')
    const res = await superagent
    .get(`${process.env.FMDURI!}/${domain}`)
    .set({Authorization})
    .then( r => ({ok: r.ok, message: null, data: r.body}) )
    .catch( r => ({ok: false, message: null, data: null}) )

    return res
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