import {connect, model, Types} from 'mongoose';

export const AccountModel = new model('Account', {
  domain: { type: String, default: "" },
  accountType: { type: String, default: "" }, // free or premuim
  trialTime: { type: String, default: "" },
  isSuspended: { type: String, default: false },
  apollo: {
    email: { type: String, default: "" },
    password: { type: String, default: "" }
  },
  cookies: { type: String, default: "" },
  proxy: { type: String, default: "http://000.000.000.000:0000" },
  lastUsed: { type: Date, default: "" } // used to pick which to use to scrape
});

export const ApolloMetadataModel = new model('apollo', {
  url: { type: String, default: "" },
  fullURL: { type: String, default: "" },
  name: { type: String, default: "" },
  maxPages: { type: String, default: "" },
  page: { type: Number, default: 0 }, // current page 
  scrapes: { type: [Object], default: []} // [{page: 1, scrapeID: ""}] - is use in ApolloDataModel
});

// TODO: 
//  might want to save cookes and proxy used for scrape

export const ApolloDataModel = new model('apolloData', {
    scrapeID: { type: String, default: "null" },
    account: { type: [Types.ObjectId], default: [] },
    url: { type: String, default: "null" },
    page: { type: String, default: "null" },
    data: {
      name: { type: String, default: "null" },
      linkedin: { type: String, default: "null" },
      title: { type: String, default: "null" },
      companyName: { type: String, default: "null" },
      companyURL: { type: String, default: "null" },
      comapnyLinkedin: { type: String, default: "null" },
      companyTwitter: { type: String, default: "null" },
      companyFacebook: { type: String, default: "null" },
      email: { type: String, default: "null" },
      isVerified: { type: Boolean, default: false },
      location: { type: String, default: "null" },
      employees: { type: String, default: "null" },
      phone: { type: String, default: "null" },
      industry: { type: String, default: "null" },
      keywords: { type: [String], default: [] }
    }
});

export const ProxyModel = new model('proxy', {
  proxy: { type: String, default: "" },
  protocol: { type: String, default: "" },
  ipAddress: { type: String, default: "" },
  port: { type: String, default: "" }
})