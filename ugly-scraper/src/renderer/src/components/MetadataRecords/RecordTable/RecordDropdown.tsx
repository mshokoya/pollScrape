import { IRecord } from '../../../../../shared/index'

export const RecordDropdown = ({ record }: { record: IRecord }) => {
  return (
    <tr className="hidden text-[0.9rem]">
      <table className="hidden">
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Name:</th>
          <td className="px-2">{record.Name}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Linkedin:</th>
          <td className="px-2">{record.Linkedin}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Title:</th>
          <td className="px-2">{record.Title}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Company Name:</th>
          <td className="px-2">{record['Company Name']}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Company Website:</th>
          <td className="px-2">{record['Company Website']}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Company Linkedin:</th>
          <td className="px-2">{record['Company Linkedin']}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Company Twitter:</th>
          <td className="px-2">{record['Company Twitter']}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Company Facebook:</th>
          <td className="px-2">{record['Company Facebook']}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Email:</th>
          <td className="px-2">{record.Email}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Location:</th>
          <td className="px-2">{record['Company Location']}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Employees:</th>
          <td className="px-2">{record.Employees}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Phone:</th>
          <td className="px-2">{record.Phone}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Industry:</th>
          <td className="px-2">{record.Industry}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Keywords:</th>
          <td className="px-2">{record.Keywords}</td>
        </tr>
      </table>
    </tr>
  )
}
