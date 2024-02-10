import superagent from 'superagent';

type CreateDomain = {
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

// type CreateDomain = {
//   retention_days: 0,
//   has_regex: false,
//   has_catchall: false,
//   has_adult_content_protection: true,
//   has_phishing_protection: true,
//   has_executable_protection: true,
//   has_virus_protection: true,
//   is_catchall_regex_disabled: false,
//   plan: 'enhanced_protection',
//   max_recipients_per_alias: 10,
//   smtp_port: '25',
//   members: [ { user: [Object], group: 'admin' } ],
//   name: 'tessa.com',
//   has_mx_record: false,
//   has_txt_record: false,
//   verification_record: 'M1Zh0IlyL6',
//   has_recipient_verification: false,
//   has_custom_verification: false,
//   id: '65c6d68c2e9ef16e4f58923a',
//   object: 'domain',
//   locale: 'en',
//   created_at: '2024-02-10T01:51:08.264Z',
//   updated_at: '2024-02-10T01:51:08.264Z',
//   link: 'https://forwardemail.net/my-account/domains/tessa.com'
// }

type VerifyDomainRes = {ok: boolean, message: string}

export const Forwarder = () => {
  const Authorization =  `Basic ${Buffer.from(`${process.env.FMTOKEN}:`).toString('base64')}`;

  const addDomain = async (domain:string, forwardToEmail: string): Promise<boolean> => {
   
    const res = await superagent
      .post(process.env.FMCDURI!)
      .set({Authorization})
      .send({catchall: forwardToEmail, domain}) 
      
    return res.ok
  }

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

  const deleteDomain = async (domain: string) => {
    const res = await superagent
    .delete(`${process.env.FMDURI!}/${domain}`)
    .set({Authorization})

    console.log(res.body)
    console.log(res.ok)

    return res
  }

  return {
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