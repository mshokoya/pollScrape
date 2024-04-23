import { ObservableObject, ObservablePrimitiveBaseFns } from '@legendapp/state'
import { Box, Button, Flex, Tabs, Text, TextField } from '@radix-ui/themes'
import { domainTaskHelper } from '@renderer/core/state/domain'

type Props = {
  addDomain: () => Promise<void>
  input: ObservablePrimitiveBaseFns<string>
}

export const DomainForms = ({ addDomain, input }: Props) => {
  const isCreateReq = !!domainTaskHelper.findTaskByReqType('domain', 'create')

  return (
    <Flex direction="column" gap="3" width="260px">
      <Tabs.Root defaultValue="domain">
        <Tabs.List
          onChange={() => {
            console.log('changed')
          }}
        >
          <Tabs.Trigger value="domain">Domain</Tabs.Trigger>
        </Tabs.List>

        <Box pt="3">
          <Tabs.Content value="domain">
            <DomainForm input={input} isCreateReq={isCreateReq} />
          </Tabs.Content>
        </Box>
      </Tabs.Root>
      <Box width="100px" mb="3">
        <Button
          onChange={() => {
            addDomain()
          }}
          size="1"
          disabled={isCreateReq}
        >
          Add Domain
        </Button>
      </Box>
    </Flex>
  )
}

type DomainProps = {
  input: ObservablePrimitiveBaseFns<string>
  isCreateReq: boolean
}

export const DomainForm = ({ input, isCreateReq }: DomainProps) => {
  return (
    <Flex direction="column" gap="1">
      <Flex align="center" gap="3">
        <label>
          <Text as="div" size="2" className="mr-[25px]">
            Domain:
          </Text>
        </label>
        <TextField.Root
          disabled={isCreateReq}
          className="w-[12rem]"
          size="1"
          placeholder="Enter your email"
          value={input.get()}
          onChange={(e) => {
            input.set(e.target.value)
          }}
        />
      </Flex>
    </Flex>
  )
}
