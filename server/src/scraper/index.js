import {
  apolloLogin,
  visitGoogle,
  goToApolloSearchUrl,
  apolloScrapePage,
} from './apollo';
import {
  scraper
} from './scraper';
import {
  getBrowserCookies,
  setBrowserCookies,
  visitGoogle
} from './util'


const apollo = async (scraper, cookies,  user, pass) => {
  const s = scraper();
  const p = s.page();

  await visitGoogle(s);
  await setBrowserCookies(p, cookies);

}