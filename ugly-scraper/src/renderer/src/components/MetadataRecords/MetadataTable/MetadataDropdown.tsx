import { appState$ } from '@renderer/core/state'
import { IMetaData } from '@shared/index'

export const MetadataDropdown = ({ meta }: { meta: IMetaData }) => {
  return (
    <tr className="hidden text-left">
      <table className="border-cyan-600 border-y text-[0.9rem]">
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2 w-4">URL:</th>
          <td className="px-2">{meta.url}</td>
        </tr>

        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2 w-4">Params:</th>
          <td className="px-2">
            {Object.keys(meta.params).length && (
              <tr>
                <table>
                  {Object.keys(meta.params).map((p, idx) => (
                    <tr key={idx} className="hover:border-cyan-600 hover:border-y">
                      <th className="whitespace-nowrap px-2 w-4">{p}</th>
                      <td className="px-2">{meta.params[p]}</td>
                    </tr>
                  ))}
                </table>
              </tr>
            )}
          </td>
        </tr>

        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2 w-4">Name:</th>
          <td className="px-2">{meta.name}</td>
        </tr>

        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2 w-4">Accounts:</th>
          <td className="px-2">
            <table className="text-center">
              <thead className="sticky top-[2rem] bg-[#111111] opacity-100">
                <tr>
                  <th className="px-2"> Email </th>
                  <th className="px-2"> Min Range </th>
                  <th className="px-2"> Max Range </th>
                </tr>
              </thead>
              <tbody>
                {meta.accounts?.length &&
                  meta.accounts.map((a0, idx) => (
                    <tr key={idx}>
                      <td className="overflow-scroll truncate">
                        {appState$.accounts.peek().find((a1) => a1.id === a0.accountID)?.email}
                      </td>
                      <td className="overflow-scroll truncate">{a0.range[0]}</td>
                      <td className="overflow-scroll truncate">{a0.range[1]}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </td>
        </tr>

        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2 w-4">Scrape:</th>
          <td className="px-2">
            <table className="text-center">
              <thead className="sticky top-[2rem] bg-[#111111] opacity-100">
                <tr>
                  <th className="px-2"> List name </th>
                  <th className="px-2"> Length </th>
                  <th className="px-2"> Date </th>
                </tr>
              </thead>
              <tbody>
                {meta.scrapes?.length &&
                  meta.scrapes.map((a0, idx) => (
                    <tr key={idx}>
                      <td className="overflow-scroll truncate">{a0.listName}</td>
                      <td className="overflow-scroll truncate">{a0.length}</td>
                      <td className="overflow-scroll truncate">{a0.date}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </td>
        </tr>
      </table>
    </tr>
  )
}
