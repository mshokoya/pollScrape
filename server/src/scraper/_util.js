// ================ 
//full = https://app.apollo.io/#/onboarding/checklist
export const apolloLoggedInURLSubstr = "onboarding/checklist"
// ================ 
//full = https://app.apollo.io/#/login
export const apolloLoggedOutURLSubstr = "login"
// ================ 
//full = // https://app.apollo.io/#/people
export const apolloPeopleURLSubstr = "/people"
export const apolloTableRowSelector = ".zp_RFed0"


export const setBrowserCookies = async (page, cookies) => {
  const items = JSON.parse(cookies)
    .map(cookie => {
      const item = Object.assign({}, cookie);
      if (!item.value) item.value = "";
      console.assert(!item.url, `Cookies must have a URL defined`);
      console.assert(
        item.url !== "about:blank",
        `Blank page can not have cookie "${item.name}"`
      );
      console.assert(
        !String.prototype.startsWith.call(item.url || "", "data:"),
        `Data URL page can not have cookie "${item.name}"`
      );
      return item;
  })
  .filter(cookie => cookie.name);

  await page.deleteCookie(...items);

  if (items.length){
    const client = await page.target().createCDPSession();
    await client.send('Network.setCookies',  { cookies: items });
  }
};

export const getBrowserCookies = async page => {
  const client = await page.target().createCDPSession();
  const { cookies } = await client.send('Network.getAllCookies');

  return cookies;
};

export const visitGoogle = async (scraper) => {
  const page = await scraper.visit("https://www.google.com/");
  await page.waitForSelector(".RNNXgb", { visible: true });
}

export const apolloUpdatePageQueryString = (url) => {
  const myURL = new URL(url);
  const pageNum = myURL.searchParams.get('page');

  if (pageNum) {
    myURL.searchParams.set('page', parseInt(pageNum)+1)
  } else {
    myURL.searchParams.set('page', 2)
  }

  return myURL.href;
}

// https://devforum.roblox.com/t/convert-1k-1m-1b-to-number/1505551

// local values = {
//   ["K"] = 1000;
//   ["M"] = 1000000;
//   ["B"] = 1000000000;
//   ["T"] = 1000000000000;
//   -- and so on... you can fill the rest in if you need to
// };

// local function AbrToNum(str: string)
//   local num, abr = str:match("^([%d.]+)(%a)$"); -- here we get the number and abbrevation from a string (case doesn't matter)
//   if num and abr then -- check if the string format is correct so nothing breaks
//       local val = values[abr:upper()]; -- get the value from 'values' table
//       if val then
//           return val * tonumber(num); -- if it exists then multiply number by value and return it
//       end
//   else
//       error("Invalid abbreviation");
//   end
// end



// local vals = {
//   --  V, Exponent
//     k = 3,   -- k = 1,000 // 10^exponent // 10^3 = 1,000
//     m = 6, -- m = 1,000,000 // 10^exponent // 10^6 = 1,000,000
//   }
  
//   -- func("1k") will return 1,000
//   return function(_abbr: string)
//           -- take the first part of the string, and the last part and separate them.
//     local num, lttr = tonumber(string.sub(_abbr, 1, -2)), string.sub(_abbr, -1)
//     return num * (10^vals[lttr]) -- multiply the number by the amount of 0's
//   end



// local function AbrevToNumber(nr_string)
// 	local number = string.gsub(nr_string, "%D", "")
// 	local abreviation = string.gsub(nr_string, "%d+", "")

// 	if abreviation == "M" then
// 		number *= 1000000
// 	end

// 	return number
// end

// print(AbrevToNumber("10M")) --// Should return 10000000






// var ranges = [
//   { divider: 1e18 , suffix: 'E' },
//   { divider: 1e15 , suffix: 'P' },
//   { divider: 1e12 , suffix: 'T' },
//   { divider: 1e9 , suffix: 'G' },
//   { divider: 1e6 , suffix: 'M' },
//   { divider: 1e3 , suffix: 'k' }
// ];

// function formatNumber(n) {
//   for (var i = 0; i < ranges.length; i++) {
//     if (n >= ranges[i].divider) {
//       return (n / ranges[i].divider).toString() + ranges[i].suffix;
//     }
//   }
//   return n.toString();
// }