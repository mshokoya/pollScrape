import { Mutex } from "async-mutex";

type ICache = { [key: string]: any } & {
  meta: { [metadataID: string]: string[] };
};
const Cache = () => {
  const _CLock = new Mutex();
  const c: ICache = { meta: { _: [] } };

  return {
    get: async (key: string) => await _CLock.runExclusive(() => c[key]),
    // set: async (key: string, value: any) => await _CLock.runExclusive(() => {c[key] = value}),
    delete: async (key: string) =>
      await _CLock.runExclusive(() => {
        delete c[key];
      }),
    // meta
    deleteMeta: async (metaID: string) =>
      await _CLock.runExclusive(() => {
        delete c.meta[metaID];
      }),
    getMeta: async (metaID: string) =>
      await _CLock.runExclusive(() => c.meta[metaID]),
    addAccounts: async (metaID: string, accountIDs: string[]) =>
      await _CLock.runExclusive(() => {
        !c.meta[metaID]
          ? (c.meta[metaID] = accountIDs)
          : (c.meta[metaID] = c.meta[metaID].concat(accountIDs));
      }),
    removeAccount: async (metaID: string, accountID: string) =>
      await _CLock.runExclusive(() => {
        if (c.meta[metaID]) {
          c.meta.length
            ? (c.meta[metaID] = c.meta[metaID].filter(
                (aID) => aID !== accountID,
              ))
            : delete c.meta[metaID];
        }
      }),
    getAllMetaIDs: async () =>
      await _CLock.runExclusive(() => Object.keys(c.meta)),
    getAllAccountIDs: async () =>
      await _CLock.runExclusive(() => Object.values(c.meta).flat()),
  };
};

export let cache: ReturnType<typeof Cache>;
export const initCache = () => {
  cache = Cache();
};
