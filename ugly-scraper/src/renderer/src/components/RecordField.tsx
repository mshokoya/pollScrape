import { Dispatch, MouseEvent, SetStateAction, useEffect, useState } from 'react'
import { downloadData, fetchData, fmtDate, getDataInCSVFmt } from '../core/util'
import { SlOptionsVertical } from 'react-icons/sl'
import { IoOptionsOutline } from 'react-icons/io5'
import { MdCheckBoxOutlineBlank } from 'react-icons/md'
import { MdCheckBox } from 'react-icons/md'
import { FaLinkedinIn } from 'react-icons/fa'
import { BiLinkAlt } from 'react-icons/bi'
import { FaTwitter } from 'react-icons/fa'
import { FaFacebookF } from 'react-icons/fa'
import { MetaPopup } from './MetaPopup'
import { appState$ } from '../core/state'
import { observer, useComputed, useObservable, useSelector } from '@legendapp/state/react'
import { IMetaData, IRecords } from 'src/shared'
import { Button, DropdownMenu } from '@radix-ui/themes'
import { ObservableComputed, ObservableObject } from '@legendapp/state'

// type MetaDispatch = Dispatch<SetStateAction<IMetaData[]>>
type MetaSubCompArgs = {
  meta: IMetaData[]
  metaChecked: ObservableObject<number[]>
}
// type RecordsDispatch = Dispatch<SetStateAction<IRecords[]>>
type RecordsSubCompArgs = {
  records: IRecords[]
  recordsChecked: ObservableObject<number[]>
  meta: IMetaData[]
  metaChecked: ObservableObject<number[]>
}

export const RecordField = observer(() => {
  const metaChecked = useObservable<number[]>([])
  const recordsChecked = useObservable<number[]>([])
  const meta = useSelector(appState$.metas) as IMetaData[]
  const records = useSelector(appState$.records) as IRecords[]

  const filteredRecords = useComputed(() => {
    const filter: string[] = []
    metaChecked.get().forEach((m) => {
      meta[m].scrapes.forEach((d) => filter.push(d.scrapeID))
    })
    return filter.length ? records.filter((r) => filter.includes(r.scrapeID)) : []
  })

  return (
    <div className="flex flex-col overflow-auto">
      <Options filteredRecords={filteredRecords} />
      <div className="flex overflow-auto grow">
        <div className="flex gap-3">
          <Meta meta={meta} metaChecked={metaChecked} />
          <Record
            records={records}
            recordsChecked={recordsChecked}
            meta={meta}
            metaChecked={metaChecked}
          />
        </div>
      </div>
    </div>
  )
})

export const Meta = ({ meta, metaChecked }: MetaSubCompArgs) => {
  const [selectedMeta, setSelectedMeta] = useState<number | null>(null)

  const handleExtendRow = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    //@ts-ignore
    const type = e.target.closest('td')?.dataset.type as string
    const metaCheckedState = metaChecked.get()

    switch (type) {
      case 'opt':
        //@ts-ignore
        setSelectedMeta(e.target.closest('tr').dataset.idx)
        break
      case 'check': {
        //@ts-ignore
        const idx = parseInt(e.target.closest('tr').dataset.idx)
        metaCheckedState.includes(idx)
          ? metaChecked.set((p) => p.filter((a) => a !== idx))
          : metaChecked.set([...metaCheckedState, idx])
        break
      }
      case 'extend':
        //@ts-ignore
        e.target.closest('tr').nextSibling.classList.toggle('hidden')
        break
    }
  }

  const handleMetaToggle = () => {
    metaChecked.get().length === meta.length
      ? metaChecked.set([])
      : metaChecked.set(meta.map((_, idx) => idx))
  }

  const PopupComp = () =>
    selectedMeta ? <MetaPopup setPopup={setSelectedMeta} meta={meta[selectedMeta]} /> : null

  return (
    <div className="border rounded border-cyan-600 flex-none w-[30%] overflow-scroll">
      <PopupComp />

      <table className="text-[0.7rem] w-[150%] table-fixed ">
        <thead className="sticky top-0 bg-[#202226] text-[0.8rem] z-10">
          <tr>
            <th className="sticky left-0 p-1.5 w-[3%] bg-[#202226]" onClick={handleMetaToggle}>
              {metaChecked.get().length === meta.length ? (
                <MdCheckBox className="bg-[#202226] inline" />
              ) : (
                <MdCheckBoxOutlineBlank className="inline" />
              )}
            </th>
            <th className="w-[25%] p-2">Name</th>
            <th className="w-[70%] p-2">URL</th>
            <th className="w-[3%] sticky bg-[#202226] right-0">
              <IoOptionsOutline className="inline" />
            </th>
          </tr>
        </thead>
        <tbody className="text-[0.9rem]" onClick={handleExtendRow}>
          {meta.length &&
            meta.map((a, idx) => (
              <>
                <tr
                  className="text-center hover:border-cyan-600 hover:border"
                  data-idx={idx}
                  key={idx}
                >
                  <td className="sticky left-0 bg-[#111111] p-1" data-type="check" data-idx={idx}>
                    {metaChecked.get().includes(idx) ? (
                      <MdCheckBox className="bg-[#111111] inline" />
                    ) : (
                      <MdCheckBoxOutlineBlank className="bg-[#111111] inline" />
                    )}
                  </td>
                  <td className="overflow-scroll truncate  p-1" data-type="extend">
                    {a.name}
                  </td>
                  <td className="overflow-scroll truncate text-[0.6rem]  p-1" data-type="extend">
                    {a.url}
                  </td>
                  <td className="sticky right-0 bg-[#111111]" data-type="opt">
                    <button>
                      <SlOptionsVertical className="inline" />
                    </button>
                  </td>
                </tr>

                {/* META OTHER TABLE */}
                <div className="text-left hidden w-[47.4rem] overflow-hidden">
                  <tr>
                    <table className="border-cyan-600 border-y text-[0.9rem] opacity-95 table-fixed">
                      <tr className="hover:border-cyan-600 hover:border-y">
                        <th className="whitespace-nowrap px-2">URL:</th>
                        <td className="px-2">
                          <div className="w-[30%]">{a.url}</div>
                        </td>
                      </tr>

                      <tr className="hover:border-cyan-600 hover:border-y">
                        <th className="whitespace-nowrap px-2 w-4">params:</th>
                        <td className="px-2"></td>
                      </tr>

                      <tr className="hover:border-cyan-600 hover:border-y">
                        <th className="whitespace-nowrap px-2 w-4">Name:</th>
                        <td className="px-2">{a.name}</td>
                      </tr>

                      <tr className="hover:border-cyan-600 hover:border-y">
                        <th className="whitespace-nowrap px-2 w-4">Accounts:</th>
                        <td className="px-2">
                          <table>
                            <thead className="sticky top-0 bg-black">
                              <tr>
                                <th className="px-2">Account Used</th>
                                <th className="px-2">Min Employee Range</th>
                                <th className="px-2">Max Employee Range</th>
                              </tr>
                            </thead>
                            <tbody className="text-[0.5rem] text-center">
                              {a.accounts?.length &&
                                a.accounts.map((a0, idx) => (
                                  <tr key={idx} className="hover:border-cyan-600 hover:border-y">
                                    <td className="px-2">
                                      {
                                        appState$.accounts
                                          .peek()
                                          .find((a1) => a1.id === a0.accountID)?.email
                                      }
                                    </td>
                                    <td className="px-2">{a0.range[0]}</td>
                                    <td className="px-2">{a0.range[1]}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>

                      <tr className="hover:border-cyan-600 hover:border-y">
                        <th className="whitespace-nowrap px-2 w-4">Scrapes:</th>
                        <td className="px-2">
                          <table>
                            <thead className="sticky top-0 bg-black">
                              <tr>
                                <th className="px-2">Length </th>
                                <th className="px-2">Date</th>
                              </tr>
                            </thead>
                            <tbody className="text-[0.5rem] text-center">
                              {a.scrapes?.length &&
                                a.scrapes.map((a0, idx) => (
                                  <tr key={idx} className="hover:border-cyan-600 hover:border-y">
                                    <td className="px-2">{a0.length}</td>
                                    <td className="px-2">{fmtDate(a0.date)}</td>
                                  </tr>
                                ))}
                              <td className="overflow-scroll bg-cyan-500/90 font-bold border-t-2">
                                {a.scrapes.reduce((acc, cur) => {
                                  const o = typeof cur.length !== 'number' ? 0 : cur.length
                                  return acc + o
                                }, 0)}
                              </td>
                              <div className="bg-cyan-500/90 font-bold border-t-2">
                                TOTAL LEADS SCRAPED
                              </div>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </tr>
                </div>
              </>
            ))}
        </tbody>
      </table>
    </div>
  )
}

export const Record = ({ records, meta, metaChecked }: RecordsSubCompArgs) => {
  const handleExtendRow = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    //@ts-ignore
    const type = e.target.closest('td')?.dataset.type as string

    switch (type) {
      case 'link':
        break
      case 'opt':
        //@ts-ignore
        console.log(e.target.closest('tr').dataset.idx)
        break
      case 'extend':
        //@ts-ignore
        e.target.closest('tr').nextSibling.classList.toggle('hidden')
        //@ts-ignore
        e.target.closest('tr').nextSibling.firstElementChild?.classList.toggle('hidden')
        break
    }
  }

  const recordFilter = () => {
    const filter: string[] = []
    metaChecked.get().forEach((m) => {
      meta[m].scrapes.forEach((d) => filter.push(d.scrapeID))
    })

    return filter.length ? records.filter((r) => filter.includes(r.scrapeID)) : []
  }

  return (
    <div className="border-cyan-600 border rounded  overflow-auto">
      <table className="text-[0.7rem]  m-auto w-[180%] table-fixed">
        <thead className="sticky top-0 bg-[#202226]  text-[0.8rem] z-10">
          <tr>
            <th className="p-2 sticky left-0 bg-[#202226]">Name</th>
            <th className="p-2">Title</th>
            <th className="p-2">Company</th>
            <th className="p-2">Email</th>
            <th className="p-2">Location</th>
            <th className="p-2"># Employees</th>
            <th className="p-2">Phone</th>
            <th className="p-2">Industry</th>
            <th className="p-2">Keywords</th>
          </tr>
        </thead>
        <tbody className="relative" onClick={handleExtendRow}>
          {records.length &&
            recordFilter().map((a, idx) => (
              <>
                <tr
                  className="text-[0.8rem] border border-cyan-600 border-opacity-30"
                  data-idx={idx}
                  key={idx}
                >
                  <td
                    className="py-3 px-2 border-opacity-30 border border-cyan-600 bg-black sticky left-0  truncate"
                    data-type="extend"
                  >
                    <div className="mb-2 truncate">{a.data.Name}</div>
                    <div>
                      <a href={a.data.Linkedin} data-type="link"></a>
                      <FaLinkedinIn />
                    </div>
                  </td>

                  <td className="py-3 px-2 truncate" data-type="extend">
                    {a.data.Title}
                  </td>

                  <td
                    className="py-3 px-2 overflow-hidden w-full max-w-full min-w-full"
                    data-type="extend"
                  >
                    <div className="mb-2 truncate">{a.data['Company Name']}</div>
                    <div className="flex gap-3">
                      {a.data['Company Website'] && (
                        <span>
                          <BiLinkAlt />
                        </span>
                      )}
                      {a.data['Company Linkedin'] && (
                        <span>
                          <FaLinkedinIn />
                        </span>
                      )}
                      {a.data['Company Twitter'] && (
                        <span>
                          <FaTwitter />
                        </span>
                      )}
                      {a.data['Company Facebook'] && (
                        <span>
                          <FaFacebookF />
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-2 truncate" data-type="extend">
                    {a.data.Email}
                  </td>

                  <td className="py-3 px-2 truncate" data-type="extend">
                    {a.data['Company Location']}
                  </td>

                  <td className="py-3 px-2 truncate text-center" data-type="extend">
                    {a.data.Employees}
                  </td>

                  <td className="py-3 px-2 truncate" data-type="extend">
                    {a.data.Phone}
                  </td>

                  <td className="py-3 px-2 truncate" data-type="extend">
                    {a.data.Industry}
                  </td>

                  <td className="py-3 px-2 truncate" data-type="extend">
                    {a.data.Keywords}
                  </td>
                </tr>

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
              </>
            ))}
        </tbody>
      </table>
    </div>
  )
}

export const Options = ({
  filteredRecords
}: {
  filteredRecords: ObservableComputed<IRecords[]>
}) => {
  return (
    <div className="w-3 mb-1">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <Button variant="soft" color="indigo">
            Options
            <DropdownMenu.TriggerIcon />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger>Download</DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent>
              <DropdownMenu.Item onClick={() => downloadData(filteredRecords.get(), 'json')}>
                JSON
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => downloadData(filteredRecords.get(), 'csv')}>
                CSV
              </DropdownMenu.Item>
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
          <DropdownMenu.Item>Select all</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item color="red">Delete Selected</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  )
}
