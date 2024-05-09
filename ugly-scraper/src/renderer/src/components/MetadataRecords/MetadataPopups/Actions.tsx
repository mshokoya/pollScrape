import { ObservableObject } from '@legendapp/state'
import { Button, Dialog, Flex, Spinner } from '@radix-ui/themes'
import { MetadataReqType, metadataTaskHelper } from '@renderer/core/state/metadata'
import { blinkCSS } from '@renderer/core/util'
import { IMetaData } from '@shared/index'
import { MetadataPopupState } from '.'

export type MetadataPopupProps = {
  meta: IMetaData
  handleRequest: (a: MetadataReqType) => void
  obs: ObservableObject<MetadataPopupState>
}

export const MetadataActions = (p: MetadataPopupProps) => {
  const isContinueReq = !!metadataTaskHelper.findTaskByReqType(p.meta.id, 'continue')
  const isUpdateReq = !!metadataTaskHelper.findTaskByReqType(p.meta.id, 'update')
  const isDeleteReq = !!metadataTaskHelper.findTaskByReqType(p.meta.id, 'delete')

  return (
    <Flex direction="column">
      <Dialog.Title className="m-auto"> {p.meta.name} settings </Dialog.Title>

      <Flex direction="column" gap="3">
        <Button
          disabled={isContinueReq}
          className={blinkCSS(isContinueReq)}
          onClick={() => {
            p.handleRequest('continue')
          }}
          variant="outline"
        >
          <Spinner loading={isContinueReq} />
          Continue scraping
        </Button>

        <Button
          disabled={isUpdateReq}
          className={blinkCSS(isUpdateReq)}
          onClick={() => {
            p.obs.page.set('update')
          }}
          variant="outline"
        >
          <Spinner loading={isUpdateReq} />
          Update account
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
      </Flex>
    </Flex>
  )
}
