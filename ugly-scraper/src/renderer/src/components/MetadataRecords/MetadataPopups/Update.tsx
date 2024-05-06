import { ObservableObject } from '@legendapp/state'
import { batch } from '@legendapp/state'
import { MetadataPopupState } from '.'
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes'
import { blinkCSS, cloneObject } from '@renderer/core/util'
import { observer } from '@legendapp/state/react'
import { IMetaData } from '@shared/index'
import { MetadataReqType, metadataTaskHelper } from '@renderer/core/state/metadata'

type UFProps = {
  handleRequest: (input: MetadataReqType) => void
  obs: ObservableObject<MetadataPopupState>
  meta: IMetaData
}

export const UpdateFields = observer(({ obs, handleRequest, meta }: UFProps) => {
  const isUpdateReq = !!metadataTaskHelper.findTaskByReqType(meta.id, 'update')

  const backToMain = () => {
    batch(() => {
      obs.input.set(cloneObject(meta))
      obs.page.set('main')
    })
  }

  const handleSubmit = () => {
    handleRequest('update')
  }

  return (
    <Flex direction="column" gap="3">
      <div onClick={backToMain}>Go Back</div>

      <Dialog.Title className="m-auto"> Edit {meta.name} </Dialog.Title>

      <label>
        <Text as="div" size="2" mb="1" weight="bold">
          Name:
        </Text>
        <TextField.Root
          defaultValue={meta.name}
          value={obs.input.name.get()}
          onChange={(e) => obs.input.name.set(e.target.value)}
          placeholder="Enter your email"
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
              obs.input.set(cloneObject(meta))
            }}
            variant="outline"
          >
            Reset
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
    </Flex>
  )
})
