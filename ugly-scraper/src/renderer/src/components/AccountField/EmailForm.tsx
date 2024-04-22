import { FormEvent } from 'react'
import { AccountReqType, accountTaskHelper, IAccount } from '../../core/state/account'
import { Observable } from '@legendapp/state'
import { ResStatusHelpers, TaskHelpers } from '@renderer/core/util'

type EmailProps = {
  input: Observable<Partial<IAccount>>
  addAccount: (e: FormEvent<HTMLFormElement>) => Promise<void>
  accountTaskHelper: ReturnType<typeof TaskHelpers<AccountReqType>>
  stateResStatusHelper: ReturnType<typeof ResStatusHelpers<AccountReqType>>
}

export const EmailForm = (props: EmailProps) => {
  const isCreateReq = !!accountTaskHelper.findTaskByReqType('account', 'create')

  return (
    <form onSubmit={props.addAccount}>
      <div className="flex basis-1/2 gap-5">
        <div>
          <div className="mb-3">
            <label className="mr-2 border-cyan-600 border-b-2" htmlFor="email">
              Email:
            </label>
            <input
              disabled={isCreateReq}
              className={`
                ${props.accountTaskHelper.getTaskByReqType('create')[0] ? 'fieldBlink' : ''}
                ${props.stateResStatusHelper.getByID('account', 0)[1] === 'ok' ? 'resOK' : ''}
                ${props.stateResStatusHelper.getByID('account', 0)[1] === 'fail' ? 'resFail' : ''}
              `}
              required
              type="text"
              id="email"
              value={props.input.email.get()}
              onChange={(e) => {
                props.input.set((p) => ({ ...p, email: e.target.value }))
              }}
            />
          </div>

          <div className="mb-3">
            <label className="mr-2 border-cyan-600 border-b-2" htmlFor="password">
              Password:
            </label>
            <input
              disabled={isCreateReq}
              className={`
                ${props.accountTaskHelper.getTaskByReqType('create')[0] ? 'fieldBlink' : ''}
                ${props.stateResStatusHelper.getByID('account', 0)[1] === 'ok' ? 'resOK' : ''}
                ${props.stateResStatusHelper.getByID('account', 0)[1] === 'fail' ? 'resFail' : ''}
              `}
              required
              type="text"
              id="password"
              value={props.input.password.get()}
              onChange={(e) => {
                props.input.set((p) => ({ ...p, password: e.target.value }))
              }}
            />
          </div>
        </div>

        {/* <div>
          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2 mb-1' htmlFor="domain">Alias Email:</label>
            <input
              disabled={isCreateReq}
              className={`
                ${ props.accountTaskHelper.getTaskByReqType('create')[0] ? 'fieldBlink' : '' }
                ${ props.stateResStatusHelper.getByID('account', 0)[1] === 'ok' ? 'resOK' : '' }
                ${ props.stateResStatusHelper.getByID('account', 0)[1] === 'fail' ? 'resFail' : '' }
              `}
              type="text" id="domain" value={props.input.domainEmail.get()} onChange={ e => {props.input.set(p => ({...p, domainEmail: e.target.value}))}}/>
          </div>

          <div className='mb-3'>
            <label className='mr-2 border-cyan-600 border-b-2 mb-1' htmlFor="recovery">Recovery Email:</label>
            <input
              disabled={isCreateReq}
              className={`
                ${ props.accountTaskHelper.getTaskByReqType('create')[0] ? 'fieldBlink' : '' }
                ${ props.stateResStatusHelper.getByID('account', 0)[1] === 'ok' ? 'resOK' : '' }
                ${ props.stateResStatusHelper.getByID('account', 0)[1] === 'fail' ? 'resFail' : '' }
              `}
              type="text" id="recovery" value={props.input.recoveryEmail.get()} onChange={ e => {props.input.set(p => ({...p, recoveryEmail: e.target.value}))}}/>
          </div>
        </div> */}
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
