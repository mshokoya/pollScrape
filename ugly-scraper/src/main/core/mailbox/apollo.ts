import { FetchMessageObject } from 'imapflow'
import { simpleParser } from 'mailparser'

export const getApolloConfirmationLinksFromMail = async (mail: FetchMessageObject) => {
  const arr = []
  const parsedData = await simpleParser(mail.source)

  const link1 = parsedData.text?.match(/(?<=Activate Your Account \( )[\S|\n]+/g)
  const link2 = parsedData.text?.match(
    /(?<=Or paste this link into your browser: )[\S|\n]+(?= \()/g
  )

  if (link1 && link1.length) arr.push(link1[0].replace('\n', '').replace('\r', ''))
  if (link2 && link2.length) arr.push(link2[0].replace('\n', '').replace('\r', ''))

  return arr
}
