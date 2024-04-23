import { ObservableObject } from '@legendapp/state'
import { AccountReqType, IAccount, accountTaskHelper } from '@renderer/core/state/account'
import { AccountPopupState } from '.'
import { blinkCSS } from '@renderer/core/util'
import { Button, Dialog, Flex, Spinner } from '@radix-ui/themes'

type MProps = {
  handleRequest: (a: AccountReqType) => Promise<void>
  obs: ObservableObject<AccountPopupState>
  account: IAccount
}

export const AccountActionsComp = (p: MProps) => {
  const isLoginReq = !!accountTaskHelper.findTaskByReqType(p.account.id, 'login')
  const isCheckReq = !!accountTaskHelper.findTaskByReqType(p.account.id, 'check')
  const isUpdateReq = !!accountTaskHelper.findTaskByReqType(p.account.id, 'update')
  const isManUpgradeReq = !!accountTaskHelper.findTaskByReqType(p.account.id, 'manualUpgrade')
  const isManLoginReq = !!accountTaskHelper.findTaskByReqType(p.account.id, 'manualLogin')
  const isUpgradeReq = !!accountTaskHelper.findTaskByReqType(p.account.id, 'upgrade')
  const isMinesReq = !!accountTaskHelper.findTaskByReqType(p.account.id, 'mines')
  const isDeleteReq = !!accountTaskHelper.findTaskByReqType(p.account.id, 'delete')
  const isConfirmReq = !!accountTaskHelper.findTaskByReqType(p.account.id, 'confirm')

  return (
    <Flex direction="column">
      <Dialog.Title className="m-auto"> {p.account.email} settings </Dialog.Title>

      <Flex direction="column" gap="3">
        <Button
          disabled={isLoginReq}
          className={blinkCSS(isLoginReq)}
          onClick={() => {
            p.handleRequest('login')
          }}
          variant="outline"
        >
          <Spinner loading={isLoginReq} />
          Login to account
        </Button>

        <Button
          disabled={isManLoginReq}
          className={blinkCSS(isManLoginReq)}
          onClick={() => {
            p.handleRequest('manualLogin')
          }}
          variant="outline"
        >
          <Spinner loading={isManLoginReq} />
          Login to account manually
        </Button>

        <Button
          disabled={isCheckReq}
          className={blinkCSS(isCheckReq)}
          onClick={() => {
            p.handleRequest('check')
          }}
          variant="outline"
        >
          <Spinner loading={isCheckReq} />
          Check account
        </Button>

        <Button
          disabled={isUpdateReq}
          className={blinkCSS(isUpdateReq)}
          onClick={() => {
            p.obs.page.set('update')
          }}
          variant="outline"
        >
          Update account
        </Button>

        <Button
          disabled={isUpgradeReq}
          className={blinkCSS(isUpgradeReq)}
          onClick={() => {
            p.handleRequest('upgrade')
          }}
          variant="outline"
        >
          <Spinner loading={isUpgradeReq} />
          Upgrade account
        </Button>

        <Button
          disabled={isManUpgradeReq}
          className={blinkCSS(isManUpgradeReq)}
          onClick={() => {
            p.handleRequest('manualLogin')
          }}
          variant="outline"
        >
          <Spinner loading={isManUpgradeReq} />
          Manually upgrade account
        </Button>

        <Button
          disabled={isMinesReq}
          className={blinkCSS(isMinesReq)}
          onClick={() => {
            p.handleRequest('mines')
          }}
          variant="outline"
        >
          <Spinner loading={isMinesReq} />
          Clear mines
        </Button>

        <Button
          disabled={isConfirmReq}
          className={blinkCSS(isConfirmReq)}
          onClick={() => {
            p.handleRequest('confirm')
          }}
          variant="outline"
        >
          <Spinner loading={isConfirmReq} />
          Confirm account
        </Button>

        <Button
          disabled={isDeleteReq}
          className={blinkCSS(isDeleteReq)}
          onClick={() => {
            p.handleRequest('delete')
          }}
          variant="outline"
        >
          <Spinner loading={isDeleteReq} />
          Delete account
        </Button>
      </Flex>

      <Flex gap="3" mt="4" justify="end">
        <Dialog.Close>
          <Button variant="soft" color="gray">
            Cancel
          </Button>
        </Dialog.Close>
        <Dialog.Close>
          <Button>Save</Button>
        </Dialog.Close>
      </Flex>
    </Flex>
  )
}
