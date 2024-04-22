import { FormEvent } from 'react'
import { fetchData } from '../../core/util'
import { AccountPopup } from './AccountPopup'
import { IDomain } from '../Domain/DomainField'
import { observer, useSelector } from '@legendapp/state/react'
import { batch } from '@legendapp/state'
import {
  accountState,
  accountTaskHelper,
  stateResStatusHelper,
  IAccount
} from '../../core/state/account'
import { appState$ } from '../../core/state'
import { CHANNELS } from '../../../../shared/util'
import { AccountTable } from './AccountTable/'
import { EmailForm } from './EmailForm'
import { DomainForm } from './DomainForm'
import { AccountForms } from './AccountForms'
import { Flex } from '@radix-ui/themes'

export const AccountField = observer(() => {
  const state = accountState //useSelector ?
  const accounts = useSelector(appState$.accounts) as IAccount[]
  const domains = useSelector(appState$.domains) as IDomain[]

  // (FIX) email verification + get domain to determine login type // also colors
  const addAccount = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await fetchData<IAccount>('account', CHANNELS.a_accountAdd, {
      ...state.input.peek(),
      addType: state.addType.peek(),
      selectedDomain: state.selectedDomain.peek()
    })
  }

  const login = async () => {
    const selectedAcc = state.selectedAcc.peek()
    const accountID = accounts[selectedAcc].id
    await fetchData('account', CHANNELS.a_accountLoginAuto, accountID)
  }

  const manualLogin = async () => {
    const selectedAcc = state.selectedAcc.peek()
    const accountID = accounts[selectedAcc].id
    await fetchData('account', CHANNELS.a_accountLoginManually, accountID)
  }

  const checkAccount = async () => {
    const selectedAcc = state.selectedAcc.peek()
    const accountID = accounts[selectedAcc].id
    await fetchData('account', CHANNELS.a_accountCheck, accountID)
  }

  const updateAccount = async (input: Partial<IAccount>) => {
    const accountID = accounts[state.selectedAcc.peek()].id
    accountTaskHelper.add(accountID, { type: 'update', status: 'processing' })
    await fetchData<IAccount>('account', CHANNELS.a_accountUpdate, accountID, input)
      .then((data) => {
        if (data.ok) {
          stateResStatusHelper.add(accountID, ['update', 'ok'])
          appState$.accounts.find((a) => a.id.peek() === accountID)?.set(data.data)
        } else {
          stateResStatusHelper.add(accountID, ['update', 'fail'])
        }
      })
      .catch(() => {
        stateResStatusHelper.add(accountID, ['update', 'fail'])
      })
      .finally(() => {
        setTimeout(() => {
          batch(() => {
            accountTaskHelper.deleteTaskByReqType(accountID, 'update')
            stateResStatusHelper.delete(accountID, 'update')
          })
        }, 1500)
      })
  }

  const upgradeAccount = async () => {
    const selectedAcc = state.selectedAcc.get()
    const accountID = accounts[selectedAcc].id
    await fetchData('account', CHANNELS.a_accountUpgradeAutomatically, accountID)
  }

  const manualUpgradeAccount = async () => {
    const selectedAcc = state.selectedAcc.get()
    const accountID = accounts[selectedAcc].id
    await fetchData('account', CHANNELS.a_accountUpgradeManually, accountID)
  }

  const clearMines = async () => {
    const selectedAcc = state.selectedAcc.get()
    const accountID = accounts[selectedAcc].id
    await fetchData('account', CHANNELS.a_accountDemine, accountID)
  }

  const confirmAccount = async () => {
    const selectedAcc = state.selectedAcc.get()
    const accountID = accounts[selectedAcc].id
    await fetchData('account', CHANNELS.a_accountConfirm, accountID)
  }

  // (FIX) complete func (dont delete, just archive)
  const deleteAccount = async () => {
    const selectedAcc = state.selectedAcc.get()
    const accountID = accounts[selectedAcc].id
    if (!accountTaskHelper.isEntityPiplineEmpty(accountID)) return

    accountTaskHelper.add(accountID, { status: 'processing', type: 'delete' })

    await fetchData<IAccount>('account', CHANNELS.a_accountDelete, accountID)
      .then((data) => {
        batch(() => {
          data.ok
            ? stateResStatusHelper.add(accountID, ['delete', 'ok'])
            : stateResStatusHelper.add(accountID, ['delete', 'fail'])
          appState$.accounts.set((a1) => a1.filter((a2) => a2.id !== accountID))
        })
      })
      .catch(() => {
        stateResStatusHelper.add(accountID, ['delete', 'fail'])
      })
      .finally(() => {
        setTimeout(() => {
          batch(() => {
            accountTaskHelper.deleteTaskByReqType(accountID, 'delete')
            stateResStatusHelper.delete(accountID, 'delete')
          })
        }, 1500)
      })
  }

  const setPopup = (v: number | null) => {
    state.selectedAcc.set(v)
  }

  return (
    <Flex className="relative grow text-xs">
      <div className="flex flex-col grow absolute inset-x-0 inset-y-0">
        {/* <div className="flex mt-1 mb-3 gap-3">
          <button
            className="text-cyan-600 border-cyan-600 border rounded p-1"
            onClick={() => state.addType.set('email')}
          >
            email
          </button>

          <button
            className="text-cyan-600 border-cyan-600 border rounded p-1"
            onClick={() => state.addType.set('domain')}
          >
            domain
          </button>
        </div> */}

        <AccountForms />

        {/* <div className="mb-2">
          {state.addType.get() === 'email' ? (
            <EmailForm
              input={state.input}
              addAccount={addAccount}
              accountTaskHelper={accountTaskHelper}
              stateResStatusHelper={stateResStatusHelper}
            />
          ) : (
            <DomainForm
              domains={domains}
              addAccount={addAccount}
              accountTaskHelper={accountTaskHelper}
              stateResStatusHelper={stateResStatusHelper}
              //@ts-ignore
              selectedDomain={state.selectedDomain}
            />
          )}
        </div> */}
        <AccountTable
          accounts={accounts}
          state={state}
          req={state.reqType.peek()}
          manualLogin={manualLogin}
          updateAccount={updateAccount}
          setPopup={setPopup}
          checkAccount={checkAccount}
          login={login}
          deleteAccount={deleteAccount}
          clearMines={clearMines}
          upgradeAccount={upgradeAccount}
          manualUpgradeAccount={manualUpgradeAccount}
          account={accounts[state.selectedAcc.get()]}
          confirmAccount={confirmAccount}
        />
      </div>
    </Flex>
  )
})
