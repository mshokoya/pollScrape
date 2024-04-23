import { useObservable } from '@legendapp/state/react'
import { DomainReqType } from '@renderer/core/state/domain'
import { IDomain } from '@shared/index'
import { DomainActionsComp } from './DomainActions'
import { UpdateFields } from './UpdateDomain'

type Props = {
  verifyDomain: () => Promise<void>
  deleteDomain: () => Promise<void>
  domain: IDomain
}

export type DomainPopupState = { input: { domain: string }; page: 'main' | 'update' }

export const DomainPopup = (p: Props) => {
  const obs = useObservable<DomainPopupState>({ input: { domain: p.domain.domain }, page: 'main' })

  const handleRequest = async (h: DomainReqType) => {
    switch (h) {
      case 'delete':
        await p.deleteDomain()
        break
      case 'verify':
        await p.verifyDomain()
        break
    }
  }

  return (
    <div>
      {obs.page.get() === 'update' ? (
        <UpdateFields handleRequest={handleRequest} obs={obs} domain={p.domain} />
      ) : (
        <DomainActionsComp handleRequest={handleRequest} obs={obs} domain={p.domain} />
      )}
    </div>
  )
}
