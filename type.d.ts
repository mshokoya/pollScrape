type IDomain = {
  _id: string
  domain: string
  authEmail: string
  verified: boolean
  MXRecords: boolean,
  TXTRecords: boolean,
  VerifyMessage: string
}