import {connect, model, Types} from 'mongoose';

export const AccountModel = new model('Account', {
  domain: { type: String, default: "" },
  accountType: { type: String, default: "" }, // free or premuim
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
  page: { type: Number, default: 0 }, //page to scrape
  scrapes: { type: [Types.ObjectId], default: [] }
});

// TODO: 
//  might want to save cookes and proxy used for scrape

export const ApolloDataModel = new model('apolloData', {
    url: { type: String, default: "" },
    maxPages: { type: String, default: "" },
    data: {
      type : {
        page: Number,
        fullURL: String,
        data: String,
      },
      default: {}
    }
});

export const ProxyModel = new model('proxy', {
  proxy: { type: String, default: "" },
  protocol: { type: String, default: "" },
  ipAddress: { type: String, default: "" },
  port: { type: String, default: "" }
})