export const setBrowserCookies = async (page, cookies) => {
  const items = cookies
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
    await page._client.send("Network.setCookies", { cookies: items });
  }
};

export const getBrowserCookies = async page => {
  const { cookies } =
    await page._client.send("Network.getAllCookies", {});
  return cookies;
};

export const visitGoogle = async (scraper) => {
  const page = scraper.visit("https://www.google.com/");
  await page.waitForSelector(".RNNXgb", { visible: true });
}