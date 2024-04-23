export const RecordDropdown = ({ record }: { record: IRecord }) => {
  return (
    <tr className="hidden text-[0.9rem]">
      <table className="hidden border-cyan-600 border-y">
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Name:</th>
          <td className="px-2">{a.data.Name}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Linkedin:</th>
          <td className="px-2">{a.data.Linkedin}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Title:</th>
          <td className="px-2">{a.data.Title}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Company Name:</th>
          <td className="px-2">{a.data['Company Name']}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Company Website:</th>
          <td className="px-2">{a.data['Company Website']}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Company Linkedin:</th>
          <td className="px-2">{a.data['Company Linkedin']}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Company Twitter:</th>
          <td className="px-2">{a.data['Company Twitter']}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Company Facebook:</th>
          <td className="px-2">{a.data['Company Facebook']}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Email:</th>
          <td className="px-2">{a.data.Email}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Location:</th>
          <td className="px-2">{a.data['Company Location']}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Employees:</th>
          <td className="px-2">{a.data.Employees}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Phone:</th>
          <td className="px-2">{a.data.Phone}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Industry:</th>
          <td className="px-2">{a.data.Industry}</td>
        </tr>
        <tr className="hover:border-cyan-600 hover:border-y">
          <th className="whitespace-nowrap px-2">Keywords:</th>
          <td className="px-2">{a.data.Keywords}</td>
        </tr>
      </table>
    </tr>
  )
}
