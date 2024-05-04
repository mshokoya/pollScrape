import { observer } from '@legendapp/state/react'
import { Button, Dialog, ScrollArea } from '@radix-ui/themes'
import { appState$ } from '@renderer/core/state'
import { domainResStatusHelper, domainState, domainTaskHelper } from '@renderer/core/state/domain'
import { MouseEvent } from 'react'
import { IoOptionsOutline } from 'react-icons/io5'
import { SlOptionsVertical } from 'react-icons/sl'
import { DomainDropdownTable } from './DomainDropdownTable'
import { DomainPopup } from '../DomainPopup'
import { IDomain } from '../../../../../shared/index'

type Props = {
  domains: IDomain[]
  deleteDomain: () => Promise<void>
  verifyDomain: () => Promise<void>
}

export const DomainTable = observer((p: Props) => {
  const handleExtendRow = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    //@ts-ignore
    const type = e.target.closest('td')?.dataset.type as string

    switch (type) {
      case 'opt': {
        //@ts-ignore
        const domainIdx = e.target.closest('tr').dataset.idx
        domainState.selectedDomain.set(domainIdx)
        break
      }
      case 'extend':
        //@ts-ignore
        e.target.closest('tr').nextSibling.classList.toggle('hidden')
        //@ts-ignore
        e.target.closest('tr').nextSibling.firstElementChild?.classList.toggle('hidden')
        break
    }
  }

  return (
    <Dialog.Root>
      <div className="border-[#2f3135] border rounded grow overflow-auto">
        <ScrollArea type="scroll">
          <table className=" w-[150%] table-fixed overflow-auto">
            <thead className="sticky top-0 bg-[#202226] text-[0.8rem] z-10">
              <tr>
                <th className="p-2">Domain</th>
                <th className="p-2">Email</th>
                <th className="p-2">Is Verified</th>
                <th className="p-2">MX Records</th>
                <th className="p-2">TXT Records</th>
                <th className="w-7 sticky bg-[#202226] right-0">
                  <IoOptionsOutline className="inline" />
                </th>
              </tr>
            </thead>
            <tbody className="text-[0.9rem] text-center" onClick={handleExtendRow}>
              {appState$.domains.get().map((domain, idx) => (
                <>
                  <tr
                    className={`
                      ${domain.verified ? 'el-ok' : 'el-no'}
                      ${domainTaskHelper.isEntityPiplineEmpty(domain.id) ? '' : 'fieldBlink'}
                      ${domainResStatusHelper.getByID(domain.id, 0)[1] === 'ok' ? 'resOK' : ''}
                      ${domainResStatusHelper.getByID(domain.id, 0)[1] === 'fail' ? 'resFail' : ''}
                      text-[0.8rem] text-center hover:border-cyan-600 hover:border
                    `}
                    data-idx={idx}
                    key={idx}
                  >
                    <td className="overflow-scroll truncate" data-type="extend">
                      {domain.domain}
                    </td>
                    <td className="overflow-scroll truncate" data-type="extend">
                      {domain.authEmail}
                    </td>
                    <td className="overflow-scroll truncate" data-type="extend">
                      {domain.verified ? 'yes' : 'no'}
                    </td>
                    <td className="overflow-scroll truncate" data-type="extend">
                      {domain.MXRecords ? 'yes' : 'no'}
                    </td>
                    <td className="overflow-scroll truncate" data-type="extend">
                      {domain.TXTRecords ? 'yes' : 'no'}
                    </td>
                    <td className="overflow-scroll sticky bg-[#111111] right-0" data-type="opt">
                      <Dialog.Trigger>
                        <Button color="gray" variant="outline" size="1">
                          <SlOptionsVertical className="inline" />
                        </Button>
                      </Dialog.Trigger>
                    </td>
                  </tr>

                  {/* OTHER TABLE */}
                  <DomainDropdownTable domain={domain} />
                </>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </div>

      {/*
            DIALOG CONTENT
    */}

      <Dialog.Content maxWidth="450px">
        {domainState.selectedDomain && (
          <DomainPopup {...p} domain={p.domains[domainState.selectedDomain.get()]} />
        )}
      </Dialog.Content>
    </Dialog.Root>
  )
})
