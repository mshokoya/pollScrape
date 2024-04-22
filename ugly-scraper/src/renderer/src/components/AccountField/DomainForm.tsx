import { FormEvent } from 'react'

import { AccountReqType, accountTaskHelper } from '../../core/state/account'
import { ResStatusHelpers, TaskHelpers } from '@renderer/core/util'
import { IDomain } from '@renderer/core/state/domain'
import { ObservableObject } from '@legendapp/state'

type DomainProps = {
  domains: IDomain[]
  addAccount: (e: FormEvent<HTMLFormElement>) => Promise<void>
  selectedDomain: ObservableObject<string>
  accountTaskHelper: ReturnType<typeof TaskHelpers<AccountReqType>>
  stateResStatusHelper: ReturnType<typeof ResStatusHelpers<AccountReqType>>
}

export const DomainForm = (props: DomainProps) => {
  const isCreateReq = !!accountTaskHelper.findTaskByReqType('account', 'create')

  return (
    <form onSubmit={props.addAccount}>
      <div className="flex basis-1/2 gap-5 mt-1 mb-3">
        <label htmlFor="domain">Select a domain:</label>

        <select
          disabled={isCreateReq}
          id="domain"
          onChange={(e) => props.selectedDomain.set(e.target.value)}
          className={`
          ${props.accountTaskHelper.getTaskByReqType('create')[0] ? 'fieldBlink' : ''}
          ${props.stateResStatusHelper.getByID('create', 0)[1] === 'ok' ? 'resOK' : ''}
          ${props.stateResStatusHelper.getByID('create', 0)[1] === 'fail' ? 'resFail' : ''}
        `}
          value={props.selectedDomain.get()}
        >
          {props.domains
            .filter((d) => d.verified === true)
            .map((d, idx) => {
              if (idx === 0) props.selectedDomain.set(d.domain)
              return (
                <option key={idx} value={d.domain}>
                  {d.domain}
                </option>
              )
            })}
        </select>
      </div>
      <input
        disabled={isCreateReq}
        className="text-cyan-600 border-cyan-600 border rounded p-1"
        type="submit"
        value="Add Account"
      />
    </form>
  )
}
