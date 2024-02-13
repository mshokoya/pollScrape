import { Dispatch, SetStateAction } from "react";
import { IoMdClose } from "react-icons/io";
import { blinkCSS } from "../core/util";
import { IDomain } from "./DomainField";
import { Spin } from "./util";

type Props = {
  setPopup: Dispatch<SetStateAction<number | null>>
  verifyDomain: () => Promise<void>
  deleteDomain: () => Promise<void>
  domain: IDomain;
  reqInProcess: string[]
  setReqInProcess?: Dispatch<SetStateAction<string[]>>
  req: ReqType | string | null
}

type ReqType = 'delete' | 'verify'

export const DomainPopup = ({setPopup, domain, verifyDomain, deleteDomain, reqInProcess, req}: Props) => {
  // const [req, setReq] = useState<ReqType>()

  const handleClose = () => setPopup(null)

  const handleRequest = async (h: ReqType) => {
    switch(h) {
      case 'delete':
        await deleteDomain()
        break
      case 'verify':
        await verifyDomain()
        break
    }
  }

  

  return (
    <div className="flex items-center justify-center fixed top-0 left-0 right-0 bottom-0 z-10" style={{background: "rgba(0,0,0,.70)"}} onClick={handleClose}>
      <div className="relative w-[30%] h-[30%] z-20 border-cyan-600 border-2 bg-black p-2 flex flex-col" onClick={e => e.stopPropagation()}>
        <IoMdClose className='absolute top-0 right-0 bg-cyan-600' onClick={handleClose}/>

        <div className='text-center border-b-2 border-cyan-600 mb-2'>
          <h1>
            <span className='text-cyan-600'>{domain.domain}</span> Settings
          </h1>
        </div>

        <div>
          <button 
            disabled={reqInProcess.includes(domain._id)} 
            onClick={() => {handleRequest('verify')}}
            className={blinkCSS(req === 'verify')}
          > Verify domain </button>
          <Spin show={req === 'verify'}/>
        </div>

        <div>
          <button 
            disabled={reqInProcess.includes(domain._id)} 
            onClick={() => {handleRequest('delete')}}
            className={blinkCSS(req === 'delete')}
          > Delete domain </button>
          <Spin show={req === 'delete'}/>
        </div>

        {
          domain.VerifyMessage && <div className="border-cyan-600 border-2 w-full h-full grow overflow-scroll">{domain.VerifyMessage}</div>
        }
      </div>
    </div>
  )
}