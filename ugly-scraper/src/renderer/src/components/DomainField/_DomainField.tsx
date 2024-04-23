import { FormEvent, MouseEvent } from 'react'
import { fetchData } from '../../core/util'
import { SlOptionsVertical } from 'react-icons/sl'
import { IoOptionsOutline } from 'react-icons/io5'
import { DomainPopup } from './DomainPopup'
import { observer, useSelector } from '@legendapp/state/react'
import { domainState, domainTaskHelper, domainResStatusHelper } from '../../core/state/domain'
import { appState$ } from '../../core/state'
import { CHANNELS } from '../../../../shared/util'

export type IDomain = {
  id: string
  domain: string
  authEmail: string
  verified: boolean
  MXRecords: boolean
  TXTRecords: boolean
  VerifyMessage: string
}

export const DomainField = observer(() => {
  const s = domainState
  const domains = useSelector(appState$.domains) as IDomain[]

  const handleExtendRow = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    //@ts-ignore
    const type = e.target.closest('td')?.dataset.type as string

    switch (type) {
      case 'opt': {
        //@ts-ignore
        const domainIdx = e.target.closest('tr').dataset.idx
        s.selectedDomain.set(domainIdx)
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

  const addDomain = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    domainTaskHelper.add('domain', { type: 'create', status: 'processing' })
    await fetchData<IDomain>('domain', CHANNELS.a_domainAdd, s.input.peek())
      .then((d) => {
        if (d.ok) {
          domainResStatusHelper.add('domain', ['create', 'ok'])
          domains.push(d.data)
        } else {
          domainResStatusHelper.add('domain', ['create', 'fail'])
        }
      })
      .catch(() => {
        domainResStatusHelper.add('domain', ['create', 'fail'])
      })
      .finally(() => {
        setTimeout(() => {
          domainTaskHelper.deleteTaskByReqType('domain', 'create')
          domainResStatusHelper.delete('domain', 'create')
        }, 1500)
      })
  }

  const handleDeleteDomain = async () => {
    const domainID = domains[s.selectedDomain.peek()].id
    const domain = domains[s.selectedDomain.peek()].domain
    domainTaskHelper.add(domainID, { type: 'delete', status: 'processing' })
    await fetchData<IDomain>('domain', CHANNELS.a_domainDelete, domain)
      .then((res) => {
        if (res.ok) {
          closePopup()
          domainResStatusHelper.add(domainID, ['delete', 'ok'])
          appState$.domains.find((d) => d.id.peek() === domainID)?.delete()
        } else {
          domainResStatusHelper.add(domainID, ['delete', 'fail'])
        }
      })
      .catch(() => {
        domainResStatusHelper.add(domainID, ['delete', 'fail'])
      })
      .finally(() => {
        setTimeout(() => {
          domainTaskHelper.deleteTaskByReqType(domainID, 'delete')
          domainResStatusHelper.delete(domainID, 'delete')
        }, 1500)
      })
  }

  const handleVerifyDomain = async () => {
    const domainID = domains[s.selectedDomain.peek()].id
    const domain = domains[s.selectedDomain.peek()].domain
    domainTaskHelper.add(domainID, { type: 'verify', status: 'processing' })
    await fetchData<IDomain>('domain', CHANNELS.a_domainVerify, domain)
      .then((res) => {
        if (res.ok) {
          domainResStatusHelper.add(domainID, ['verify', 'ok'])
          appState$.domains.find((d) => d.id.peek() === domainID)?.set(res.data)
        } else {
          domainResStatusHelper.add(domainID, ['verify', 'fail'])
        }
      })
      .catch(() => {
        domainResStatusHelper.add(domainID, ['verify', 'fail'])
      })
      .finally(() => {
        setTimeout(() => {
          domainTaskHelper.deleteTaskByReqType(domainID, 'verify')
          domainResStatusHelper.delete(domainID, 'verify')
        }, 1500)
      })
  }

  const closePopup = () => {
    s.selectedDomain.set(null)
  }

  const PopupComp = () =>
    s.selectedDomain.get() ? (
      <DomainPopup
        domain={domains[s.selectedDomain.peek()]}
        closePopup={closePopup}
        verifyDomain={handleVerifyDomain}
        deleteDomain={handleDeleteDomain}
      />
    ) : null

  return (
    <>
      <PopupComp />
      <div className="flex relative grow text-xs">
        <div className="flex flex-col grow absolute inset-x-0 inset-y-0">
          <div className="mb-2">
            <form onSubmit={addDomain}>
              <div className="mb-3">
                <label className="mr-2 border-cyan-600 border-b-2" htmlFor="domain">
                  Domain:
                </label>
                <input
                  className={`
                    text-[0.8rem] text-center hover:border-cyan-600 hover:border
                    ${domainTaskHelper.getTaskByReqType('create')[0] ? 'fieldBlink' : ''}
                    ${domainResStatusHelper.getByID('domain', 0)[1] === 'ok' ? 'resOK' : ''}
                    ${domainResStatusHelper.getByID('domain', 0)[1] === 'fail' ? 'resFail' : ''}
                  `}
                  required
                  type="text"
                  id="domain"
                  value={s.input.domain.get()}
                  onChange={(e) => {
                    s.input.domain.set(e.target.value)
                  }}
                />
              </div>

              <input
                disabled={!!domainTaskHelper.getTaskByReqType('create')[0]}
                className="text-cyan-600 border-cyan-600 border rounded p-1"
                type="submit"
                value="Add Domain"
              />
            </form>
          </div>

          <div className="border-cyan-600 border rounded grow overflow-auto">
            <table className="text-[0.7rem]  m-auto w-[150%] table-fixed overflow-auto">
              <thead className="sticky top-0 bg-[#202226] text text-[0.8rem] z-10">
                <tr>
                  <th className="p-2">Domain</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Is Verified</th>
                  <th className="w-7 sticky bg-[#202226] right-0">
                    <IoOptionsOutline className="inline" />
                  </th>
                </tr>
              </thead>
              <tbody className="text-[0.5rem]" onClick={handleExtendRow}>
                {domains.map((a, idx) => (
                  <>
                    <tr
                      className={`
                          ${a.verified ? 'el-ok' : 'el-no'}
                          ${domainTaskHelper.isEntityPiplineEmpty(a.id) ? '' : 'fieldBlink'}
                          ${domainResStatusHelper.getByID(a.id, 0)[1] === 'ok' ? 'resOK' : ''}
                          ${domainResStatusHelper.getByID(a.id, 0)[1] === 'fail' ? 'resFail' : ''}
                          text-[0.8rem] text-center hover:border-cyan-600 hover:border
                        `}
                      data-idx={idx}
                      key={idx}
                    >
                      <td className="overflow-scroll truncate  p-1" data-type="extend">
                        {a.domain}
                      </td>
                      <td className="overflow-scroll truncate  p-1" data-type="extend">
                        {a.authEmail}
                      </td>
                      <td className="overflow-scroll truncate  p-1" data-type="extend">
                        {a.verified ? 'yes' : 'no'}
                      </td>
                      <td className="overflow-scroll truncate  p-1" data-type="extend">
                        {a.MXRecords}
                      </td>
                      <td className="overflow-scroll truncate  p-1" data-type="extend">
                        {a.TXTRecords}
                      </td>
                      <td className="overflow-scroll sticky bg-[#111111] right-0" data-type="opt">
                        <button>
                          <SlOptionsVertical className="inline" />
                        </button>
                      </td>
                    </tr>
                    <tr className="hidden">
                      <table className="hidden border-cyan-600 border-y text-[0.7rem]">
                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2">Domain:</th>
                          <td className="px-2">{a.domain}</td>
                        </tr>
                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2">Email:</th>
                          <td className="px-2">{a.authEmail}</td>
                        </tr>
                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2">Verified:</th>
                          <td className="px-2">{a.verified ? 'yes' : 'no'}</td>
                        </tr>
                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2">TXT Records:</th>
                          <td className="px-2">{a.TXTRecords ? 'yes' : 'no'}</td>
                        </tr>
                        <tr className="hover:border-cyan-600 hover:border-y">
                          <th className="whitespace-nowrap px-2">MX Records:</th>
                          <td className="px-2">{a.MXRecords ? 'yes' : 'no'}</td>
                        </tr>
                      </table>
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
})
