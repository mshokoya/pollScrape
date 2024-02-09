import superagent from 'superagent';

type CreateDomain = {
  plan: string
  has_mx_record: boolean,
  has_txt_record: boolean,
  name: string,
  verification_record: string,
  id: string,
  object: string,
  created_at: Date,
  updated_at: Date,
  max_recipients_per_alias: number,
  smtp_port: string,
  has_executable_protection: boolean,
  has_phishing_protection: boolean,
  has_virus_protection: boolean,
  has_adult_content_protection: boolean,
  has_custom_verification: boolean,
  has_recipient_verification: boolean,
  is_catchall_regex_disabled: boolean,
  last_allowlist_sync_at: Date,
  has_catchall: boolean,
  has_regex: boolean,
  retention_days: number,
  link: string
}

export const Forwarder = () => {

  const addDomain = async (domain:string, forwardToEmail: string): Promise<boolean> => {
    const res = await superagent
      .post(process.env.FMCDURI!)
      .set({'Authorization': process.env.FMTOKEN!})
      .send({catchall: forwardToEmail, domain}) 

      console.log(res.body)
      console.log(res.ok)

    return res.ok
  }

  const verifyDomain = async (domain: string) => {
    const res = await superagent
    .get(`${process.env.FMDURI!}/${domain}/verify-records`)
    .set({'Authorization': process.env.FMTOKEN!})

    console.log(res.body)
    console.log(res.ok)

    return res.ok
  }

  const deleteDomain = async (domain: string) => {
    const res = await superagent
    .delete(`${process.env.FMDURI!}/${domain}`)
    .set({'Authorization': process.env.FMTOKEN!})

    console.log(res.body)
    console.log(res.ok)

    return res.ok
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