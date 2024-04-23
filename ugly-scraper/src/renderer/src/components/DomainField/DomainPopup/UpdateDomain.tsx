import { DomainReqType, domainTaskHelper } from '@renderer/core/state/domain'
import { DomainPopupState } from '.'
import { ObservableObject } from '@legendapp/state'
import { IDomain } from '@shared/index'
import { observer } from '@legendapp/state/react'
import { batch } from '@legendapp/state'
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes'
import { blinkCSS } from '@renderer/core/util'

type UpdateDomainProps = {
  handleRequest: (h: DomainReqType) => void
  obs: ObservableObject<DomainPopupState>
  domain: IDomain
}

export const UpdateFields = observer(({ obs, handleRequest, domain }: UpdateDomainProps) => {
  const isUpdateReq = !!domainTaskHelper.findTaskByReqType(domain.id, 'update')

  const backToMain = () => {
    batch(() => {
      obs.input.set(JSON.parse(JSON.stringify(domain.domain)))
      obs.page.set('main')
    })
  }

  const handleSubmit = () => {
    handleRequest('update')
  }

  return (
    <Flex direction="column" gap="1">
      <div onClick={backToMain}>Go Back</div>

      <Dialog.Title className="m-auto"> Edit {domain.domain} </Dialog.Title>

      <label>
        <Text as="div" size="2" mb="1" weight="bold">
          Domain
        </Text>
        <TextField.Root
          defaultValue={domain.domain}
          value={obs.input.domain.get()}
          onChange={(e) => obs.input.domain.set(e.target.value)}
          placeholder="Enter your domain"
        />
      </label>

      <Flex gap="3" mt="4" justify="between">
        <Flex gap="3">
          <Button
            disabled={isUpdateReq}
            className={blinkCSS(isUpdateReq)}
            onClick={() => {
              handleSubmit()
            }}
            variant="outline"
          >
            Save
          </Button>

          <Button
            disabled={isUpdateReq}
            onClick={() => {
              obs.input.set(JSON.parse(JSON.stringify(domain)))
            }}
            variant="outline"
          >
            Reset
          </Button>
        </Flex>

        <Flex>
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Close
            </Button>
          </Dialog.Close>
        </Flex>
      </Flex>
    </Flex>
  )
})
