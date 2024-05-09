import { ObservableObject } from '@legendapp/state'
import { batch } from '@legendapp/state'
import { AccountReqType, IAccount, accountTaskHelper } from '@renderer/core/state/account'
import { AccountPopupState } from '.'
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes'
import { blinkCSS } from '@renderer/core/util'
import { observer } from '@legendapp/state/react'

type UFProps = {
  handleRequest: (input: AccountReqType) => Promise<void>
  obs: ObservableObject<AccountPopupState>
  account: IAccount
}

export const UpdateFields = observer(({ obs, handleRequest, account }: UFProps) => {
  const isUpdateReq = !!accountTaskHelper.findTaskByReqType(account.id, 'update')

  const backToMain = () => {
    batch(() => {
      obs.input.set(
        JSON.parse(JSON.stringify({ email: account.email, password: account.password }))
      )
      obs.page.set('main')
    })
  }

  const handleSubmit = () => {
    handleRequest('update')
  }

  return (
    <Flex direction="column" gap="3">
      <div onClick={backToMain}>Go Back</div>

      <Dialog.Title className="m-auto"> Edit {account.email} </Dialog.Title>

      <label>
        <Text as="div" size="2" mb="1" weight="bold">
          Email
        </Text>
        <TextField.Root
          defaultValue={account.email}
          value={obs.input.email.get()}
          onChange={(e) => obs.input.email.set(e.target.value)}
          placeholder="Enter your email"
        />
      </label>

      <label>
        <Text as="div" size="2" mb="1" weight="bold">
          Password
        </Text>
        <TextField.Root
          defaultValue={account.password}
          value={obs.input.password.get()}
          onChange={(e) => obs.input.password.set(e.target.value)}
          placeholder="Enter your email"
        />
      </label>

      <Flex gap="3" mt="4" justify="between">
        <Flex gap="3">
          <Button
            disabled={isUpdateReq}
            className={blinkCSS(isUpdateReq)}
            onClick={() => handleSubmit()}
            variant="outline"
          >
            Save
          </Button>

          <Button
            disabled={isUpdateReq}
            onClick={() => {
              obs.input.set(
                JSON.parse(JSON.stringify({ email: account.email, password: account.password }))
              )
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
