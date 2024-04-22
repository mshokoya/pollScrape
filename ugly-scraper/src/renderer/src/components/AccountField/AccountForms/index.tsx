import { Box, Button, Flex, Tabs, Text, TextField } from '@radix-ui/themes'

export const AccountForms = () => {
  return (
    <Flex direction="column" gap="3">
      <Tabs.Root defaultValue="email">
        <Tabs.List>
          <Tabs.Trigger value="email">Email</Tabs.Trigger>
          <Tabs.Trigger value="domain">Domain</Tabs.Trigger>
        </Tabs.List>

        <Box pt="3">
          <Tabs.Content value="email">
            <EmailForm />
          </Tabs.Content>

          <Tabs.Content value="domain">
            <DomainForm />
          </Tabs.Content>
        </Box>
      </Tabs.Root>
      <Button>Add Account</Button>
    </Flex>
  )
}

export const EmailForm = () => {
  return (
    <Flex direction="column" gap="1">
      <Flex align="center" gap="3">
        <label>
          <Text as="div" size="2" className="mr-[25px]">
            Email:
          </Text>
        </label>
        <TextField.Root className="w-[12rem]" size="1" placeholder="Enter your email" />
      </Flex>

      <Flex align="center" gap="3">
        <label>
          <Text as="div" size="2">
            Password:
          </Text>
        </label>
        <TextField.Root className="w-[12rem]" size="1" placeholder="Enter your password" />
      </Flex>
    </Flex>
  )
}

export const DomainForm = () => {
  return <div>Domain form</div>
}
