import { FormEvent } from 'react'
import { fetchData } from '../../core/util'
import { IDomain } from '@shared/index'
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

    try {
      accountTaskHelper.add('createReq', { type: 'createReq', status: 'processing' })
      if (!accountTaskHelper.isEntityPiplineEmpty('createReq'))
        throw new Error('[Error]: Account already in use, please wait for account to be free')

      await fetchData('account', CHANNELS.a_accountLoginAuto, 'createReq').then((data) => {
        data.ok
          ? stateResStatusHelper.add('createReq', ['createReq', 'ok'])
          : stateResStatusHelper.add('createReq', ['createReq', 'fail'])
      })
    } catch {
      stateResStatusHelper.add('createReq', ['createReq', 'fail'])
    } finally {
      setTimeout(() => {
        batch(() => {
          accountTaskHelper.deleteTaskByReqType('createReq', 'createReq')
          stateResStatusHelper.delete('createReq', 'createReq')
        })
      }, 1500)
    }
  }

  const login = async () => {
    const selectedAcc = state.selectedAcc.peek()
    const accountID = accounts[selectedAcc].id

    try {
      accountTaskHelper.add(accountID, { type: 'loginReq', status: 'processing' })
      if (!accountTaskHelper.isEntityPiplineEmpty(accountID))
        throw new Error('[Error]: Account already in use, please wait for account to be free')

      await fetchData('account', CHANNELS.a_accountLoginAuto, accountID).then((data) => {
        data.ok
          ? stateResStatusHelper.add(accountID, ['loginReq', 'ok'])
          : stateResStatusHelper.add(accountID, ['loginReq', 'fail'])
      })
    } catch {
      stateResStatusHelper.add(accountID, ['loginReq', 'fail'])
    } finally {
      setTimeout(() => {
        batch(() => {
          accountTaskHelper.deleteTaskByReqType(accountID, 'loginReq')
          stateResStatusHelper.delete(accountID, 'loginReq')
        })
      }, 1500)
    }
  }

  const manualLogin = async () => {
    const selectedAcc = state.selectedAcc.peek()
    const accountID = accounts[selectedAcc].id

    try {
      accountTaskHelper.add(accountID, { type: 'manualLoginReq', status: 'processing' })
      if (!accountTaskHelper.isEntityPiplineEmpty(accountID))
        throw new Error('[Error]: Account already in use, please wait for account to be free')

      await fetchData('account', CHANNELS.a_accountLoginManually, accountID).then((data) => {
        data.ok
          ? stateResStatusHelper.add(accountID, ['manualLoginReq', 'ok'])
          : stateResStatusHelper.add(accountID, ['manualLoginReq', 'fail'])
      })
    } catch {
      stateResStatusHelper.add(accountID, ['manualLoginReq', 'fail'])
    } finally {
      setTimeout(() => {
        batch(() => {
          accountTaskHelper.deleteTaskByReqType(accountID, 'manualLoginReq')
          stateResStatusHelper.delete(accountID, 'manualLoginReq')
        })
      }, 1500)
    }
  }

  const checkAccount = async () => {
    const selectedAcc = state.selectedAcc.peek()
    const accountID = accounts[selectedAcc].id

    try {
      accountTaskHelper.add(accountID, { type: 'checkReq', status: 'processing' })
      if (!accountTaskHelper.isEntityPiplineEmpty(accountID))
        throw new Error('[Error]: Account already in use, please wait for account to be free')

      await fetchData('account', CHANNELS.a_accountCheck, accountID).then((data) => {
        data.ok
          ? stateResStatusHelper.add(accountID, ['checkReq', 'ok'])
          : stateResStatusHelper.add(accountID, ['checkReq', 'fail'])
      })
    } catch {
      stateResStatusHelper.add(accountID, ['checkReq', 'fail'])
    } finally {
      setTimeout(() => {
        batch(() => {
          accountTaskHelper.deleteTaskByReqType(accountID, 'checkReq')
          stateResStatusHelper.delete(accountID, 'checkReq')
        })
      }, 1500)
    }
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

    try {
      accountTaskHelper.add(accountID, { type: 'autoUpgradeReq', status: 'processing' })
      if (!accountTaskHelper.isEntityPiplineEmpty(accountID))
        throw new Error('[Error]: Account already in use, please wait for account to be free')

      await fetchData('account', CHANNELS.a_accountUpgradeAutomatically, accountID).then((data) => {
        data.ok
          ? stateResStatusHelper.add(accountID, ['autoUpgradeReq', 'ok'])
          : stateResStatusHelper.add(accountID, ['autoUpgradeReq', 'fail'])
      })
    } catch {
      stateResStatusHelper.add(accountID, ['autoUpgradeReq', 'fail'])
    } finally {
      setTimeout(() => {
        batch(() => {
          accountTaskHelper.deleteTaskByReqType(accountID, 'autoUpgradeReq')
          stateResStatusHelper.delete(accountID, 'autoUpgradeReq')
        })
      }, 1500)
    }
  }

  const manualUpgradeAccount = async () => {
    const selectedAcc = state.selectedAcc.get()
    const accountID = accounts[selectedAcc].id

    try {
      accountTaskHelper.add(accountID, { type: 'manualUpgradeReq', status: 'processing' })
      if (!accountTaskHelper.isEntityPiplineEmpty(accountID))
        throw new Error('[Error]: Account already in use, please wait for account to be free')

      await fetchData('account', CHANNELS.a_accountUpgradeManually, accountID).then((data) => {
        data.ok
          ? stateResStatusHelper.add(accountID, ['manualUpgradeReq', 'ok'])
          : stateResStatusHelper.add(accountID, ['manualUpgradeReq', 'fail'])
      })
    } catch {
      stateResStatusHelper.add(accountID, ['manualUpgradeReq', 'fail'])
    } finally {
      setTimeout(() => {
        batch(() => {
          accountTaskHelper.deleteTaskByReqType(accountID, 'manualUpgradeReq')
          stateResStatusHelper.delete(accountID, 'manualUpgradeReq')
        })
      }, 1500)
    }
  }

  const clearMines = async () => {
    const selectedAcc = state.selectedAcc.get()
    const accountID = accounts[selectedAcc].id
    try {
      accountTaskHelper.add(accountID, { type: 'minesReq', status: 'processing' })
      if (!accountTaskHelper.isEntityPiplineEmpty(accountID))
        throw new Error('[Error]: Account already in use, please wait for account to be free')

      await fetchData('account', CHANNELS.a_accountDemine, {
        accountID,
        timeout: {
          time: 10000,
          rounds: 2
        }
      }).then((data) => {
        data.ok
          ? stateResStatusHelper.add(accountID, ['minesReq', 'ok'])
          : stateResStatusHelper.add(accountID, ['minesReq', 'fail'])
      })
    } catch {
      stateResStatusHelper.add(accountID, ['minesReq', 'fail'])
    } finally {
      setTimeout(() => {
        batch(() => {
          accountTaskHelper.deleteTaskByReqType(accountID, 'minesReq')
          stateResStatusHelper.delete(accountID, 'minesReq')
        })
      }, 1500)
    }
  }

  const confirmAccount = async () => {
    const selectedAcc = state.selectedAcc.get()
    const accountID = accounts[selectedAcc].id
    try {
      accountTaskHelper.add(accountID, { type: 'confirmReq', status: 'processing' })
      if (!accountTaskHelper.isEntityPiplineEmpty(accountID))
        throw new Error('[Error]: Account already in use, please wait for account to be free')

      await fetchData('account', CHANNELS.a_accountConfirm, accountID).then((data) => {
        data.ok
          ? stateResStatusHelper.add(accountID, ['confirmReq', 'ok'])
          : stateResStatusHelper.add(accountID, ['confirmReq', 'fail'])
      })
    } catch {
      stateResStatusHelper.add(accountID, ['confirmReq', 'fail'])
    } finally {
      setTimeout(() => {
        batch(() => {
          accountTaskHelper.deleteTaskByReqType(accountID, 'confirmReq')
          stateResStatusHelper.delete(accountID, 'confirmReq')
        })
      }, 1500)
    }
  }

  // (FIX) complete func (dont delete, just archive)
  const deleteAccount = async () => {
    const selectedAcc = state.selectedAcc.get()
    const accountID = accounts[selectedAcc].id

    try {
      accountTaskHelper.add(accountID, { type: 'delete', status: 'processing' })

      if (!accountTaskHelper.isEntityPiplineEmpty(accountID))
        throw new Error('[Error]: Account already in use, please wait for account to be free')

      await fetchData<IAccount>('account', CHANNELS.a_accountDelete, accountID).then((data) => {
        batch(() => {
          data.ok
            ? stateResStatusHelper.add(accountID, ['delete', 'ok'])
            : stateResStatusHelper.add(accountID, ['delete', 'fail'])
          appState$.accounts.set((a1) => a1.filter((a2) => a2.id !== accountID))
        })
      })
    } catch {
      stateResStatusHelper.add(accountID, ['delete', 'fail'])
    } finally {
      setTimeout(() => {
        batch(() => {
          accountTaskHelper.deleteTaskByReqType(accountID, 'delete')
          stateResStatusHelper.delete(accountID, 'delete')
        })
      }, 1500)
    }
  }

  return (
    <Flex className="relative grow text-xs">
      <Flex direction="column" flexGrow="1" className="absolute inset-x-0 inset-y-0">
        <AccountForms
          input={state.input}
          addAccount={addAccount}
          accountTaskHelper={accountTaskHelper}
          stateResStatusHelper={stateResStatusHelper}
          domains={domains}
          selectedDomain={state.selectedDomain}
        />

        <AccountTable
          accounts={accounts}
          state={state}
          req={state.reqType.peek()}
          manualLogin={manualLogin}
          updateAccount={updateAccount}
          checkAccount={checkAccount}
          login={login}
          deleteAccount={deleteAccount}
          clearMines={clearMines}
          upgradeAccount={upgradeAccount}
          manualUpgradeAccount={manualUpgradeAccount}
          account={accounts[state.selectedAcc.get()]}
          confirmAccount={confirmAccount}
        />
      </Flex>
    </Flex>
  )
})
