import { IoMdClose } from 'react-icons/io'
import { blinkCSS } from '../../core/util'
import { IDomain } from './DomainField'
import { Spin } from '../util'
import { domainTaskHelper, DomainReqType } from '../../core/state/domain'

type Props = {
  closePopup: () => void
  verifyDomain: () => Promise<void>
  deleteDomain: () => Promise<void>
  domain: IDomain
}

export const DomainPopup = (p: Props) => {
  const isVerifyReq = !!domainTaskHelper.findTaskByReqType(p.domain.id, 'verify')
  const isDeleteReq = !!domainTaskHelper.findTaskByReqType(p.domain.id, 'delete')

  const close = () => p.closePopup()

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
    <div
      className="flex items-center justify-center fixed top-0 left-0 right-0 bottom-0 z-10"
      style={{ background: 'rgba(0,0,0,.70)' }}
      onClick={close}
    >
      <div
        className="relative w-[30%] h-[30%] z-20 border-cyan-600 border-2 bg-black p-2 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <IoMdClose className="absolute top-0 right-0 bg-cyan-600" onClick={close} />

        <div className="text-center border-b-2 border-cyan-600 mb-2">
          <h1>
            <span className="text-cyan-600">{p.domain.domain}</span> Settings
          </h1>
        </div>

        <div>
          <button
            disabled={isVerifyReq}
            onClick={() => {
              handleRequest('verify')
            }}
            className={blinkCSS(isVerifyReq)}
          >
            {' '}
            Verify domain{' '}
          </button>
          <Spin show={isVerifyReq} />
        </div>

        <div>
          <button
            disabled={isDeleteReq}
            onClick={() => {
              handleRequest('delete')
            }}
            className={blinkCSS(isDeleteReq)}
          >
            {' '}
            Delete domain{' '}
          </button>
          <Spin show={isDeleteReq} />
        </div>

        {p.domain.VerifyMessage && (
          <div className="border-cyan-600 border-2 w-full h-full grow overflow-scroll">
            {p.domain.VerifyMessage}
          </div>
        )}
      </div>
    </div>
  )
}
