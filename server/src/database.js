import {connect, model} from 'mongoose';

const Account = new model('Account', {
  domain: String,
  accountType: String,
  isSuspended: Boolean,
  apollo: {
    username: String,
    password: String
  },
  cookies: String,
  proxy: String,
});

const Apollo = new model('Apollo', {
  url: String,
  name: String,
  page: String,
  scrape: {
    type: Map,
    of: String
  }
});