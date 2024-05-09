import { IAccount } from '@renderer/core/state/account'
import { fmtDate } from '@renderer/core/util'

export const DropdownTable = ({ account }: { account: IAccount }) => {
  return (
    <tr className="hidden text-left">
      <table
        className={`hidden border-cyan-600 border-y text-[0.9rem] ${account.emailCreditsUsed !== account.emailCreditsLimit ? 'el-ok' : 'el-no'}`}
      >
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2 w-4">Email:</th>
          <td className="px-2">{account.email}</td>
        </tr>

        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2 w-4">Password:</th>
          <td className="px-2">{account.password}</td>
        </tr>

        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2 w-4">Credits Used:</th>
          <td className="px-2">
            {account.emailCreditsUsed === -1 ? 'N/account' : account.emailCreditsUsed}
          </td>
        </tr>

        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2 w-4">Credits Limit:</th>
          <td className="px-2">
            {account.emailCreditsLimit === -1 ? 'N/account' : account.emailCreditsLimit}
          </td>
        </tr>

        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2 w-4">Credits Renewal Date:</th>
          <td className="px-2">{fmtDate(account.renewalEndDate)}</td>
        </tr>

        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2 w-4">Trial Days Left:</th>
          <td className="px-2">
            {account.trialDaysLeft === -1 ? 'N/account' : account.trialDaysLeft}
          </td>
        </tr>

        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2 w-4">Is Suspended ?:</th>
          <td className="px-2">{account.suspended ? 'yes' : 'no'}</td>
        </tr>

        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2 w-4">Logged In ?:</th>
          <td className="px-2">{account.cookies ? 'yes' : 'no'}</td>
        </tr>

        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2 w-4">Proxy:</th>
          <td className="px-2">{account.proxy ? account.proxy : 'N/account'}</td>
        </tr>

        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2 w-4">Trial:</th>
          <td className="px-2">{fmtDate(account.trialTime)}</td>
        </tr>

        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2 w-4">Last Used:</th>
          <td className="px-2">{fmtDate(account.lastUsed)}</td>
        </tr>

        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2 w-4">History:</th>
          <td className="px-2">
            <table className="text-center">
              <thead className="sticky top-[2rem] bg-[#111111] opacity-100">
                <tr>
                  <th className="px-2"> Amount Scraped </th>
                  <th className="px-2"> Time Of Scraped </th>
                  <th className="px-2"> ListName </th>
                </tr>
              </thead>
              <tbody>
                {account.history.map((h, idx) => (
                  <tr key={idx}>
                    <td className="overflow-scroll truncate">{h[0] || 'N/account'}</td>
                    <td className="overflow-scroll truncate">{fmtDate(h[1])}</td>
                    <td className="overflow-scroll truncate">{h[2] || 'N/account'} </td>
                  </tr>
                ))}
                <tr>
                  <td className="overflow-scroll bg-cyan-500/90 font-bold border-t-2">
                    {account.history.reduce((acc, cur) => {
                      const o = typeof cur[0] !== 'number' ? 0 : cur[0]
                      return acc + o
                    }, 0)}
                  </td>
                  <div className="bg-cyan-500/90 font-bold border-t-2">TOTAL LEADS SCRAPED</div>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </table>
    </tr>
  )
}
