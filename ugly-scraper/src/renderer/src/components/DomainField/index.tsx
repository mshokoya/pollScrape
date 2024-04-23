import { FormEvent, MouseEvent } from 'react'
import { fetchData } from '../../core/util'
import { observer, useSelector } from '@legendapp/state/react'
import { domainState, domainTaskHelper, domainResStatusHelper } from '../../core/state/domain'
import { appState$ } from '../../core/state'
import { CHANNELS } from '../../../../shared/util'
import { Button, Flex } from '@radix-ui/themes'
import { DomainTable } from './DomainTable'
import { IDomain } from '@shared/index'

export const DomainField = observer(() => {
  const s = domainState
  const domains = useSelector(appState$.domains) as IDomain[]

  const addDomain = async () => {
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

  const deleteDomain = async () => {
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

  const verifyDomain = async () => {
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

  return (
    <Flex className="relative grow text-xs">
      <Flex direction="column" flexGrow="1" className="absolute inset-x-0 inset-y-0">
        <Button>dsadassa </Button>

        <DomainTable
          domains={domains}
          addDomain={addDomain}
          deleteDomain={deleteDomain}
          verifyDomain={verifyDomain}
          // updateDomain={updateDomain}
        />
      </Flex>
    </Flex>
  )
})
