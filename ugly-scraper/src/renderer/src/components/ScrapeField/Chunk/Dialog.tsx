import { ObservableObject } from '@legendapp/state'
import { observer } from '@legendapp/state/react'
import { Button, Dialog, Flex, Text, Table, Separator, Box, Select } from '@radix-ui/themes'
import { IoArrowDown, IoArrowUp } from 'react-icons/io5'

export type ChunkCompProps = {
  aar: ObservableObject<{
    rounds: string
    timeout: [string, string, string]
    accounts: { email: string; totalScrapedInTimeFrame: number }[]
    chunk: [min: number, max: number][]
  }>
  maxScrapeLimit: number
  chunkParts: number
  handleChunkPart: (val: 'inc' | 'dec') => void
  chunkingInProcess: boolean
}

export const ChunkDialog = observer(
  ({ aar, chunkParts, handleChunkPart, maxScrapeLimit, chunkingInProcess }: ChunkCompProps) => {
    const timeout = `${aar.timeout[0].get()}h:${aar.timeout[1].get()}m:${aar.timeout[2].get()}s`
    const rounds = aar.rounds.get()
    return (
      <Flex direction="column" height="500px" gap="3">
        <Box mx="auto" mb="2">
          <Dialog.Title>Accounts For Scrape</Dialog.Title>
        </Box>

        <Flex direction="column" gap="2" align="center">
          <Flex direction="column" overflow="scroll">
            <Flex direction="column" gap="3" mb="3">
              <Flex gap="2">
                <Text>Timeout:</Text>
                <TimeoutComp aar={aar} />
              </Flex>

              <Flex gap="2">
                <Text>Rounds:</Text>
                <RoundsComp aar={aar} />
              </Flex>
            </Flex>

            <Flex gap="3" className="text-[0.8rem]">
              <Text>Chunk:</Text>
              <button
                type="button"
                disabled={chunkingInProcess}
                onClick={() => {
                  handleChunkPart('dec')
                }}
              >
                <IoArrowDown />
              </button>
              <span> {chunkParts} </span>
              <button
                type="button"
                disabled={chunkingInProcess}
                onClick={() => {
                  handleChunkPart('inc')
                }}
              >
                <IoArrowUp />
              </button>
            </Flex>
            <Box width="7rem">
              <Separator orientation="horizontal" mt="2" mb="1" size="4" />
            </Box>

            <Flex overflow="scroll" align="center">
              {aar.chunk?.get().length && (
                <Table.Root size="1" className="w-[600px] h-[300px]">
                  <Table.Header className="sticky top-0 bg-[#111111]">
                    <Table.Row>
                      <Table.ColumnHeaderCell maxWidth="10rem" className="text-[0.7rem]">
                        Accounts
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell maxWidth="7rem" className="text-[0.7rem]">
                        Range
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell maxWidth="7rem" className="text-[0.6rem]">
                        Total leads
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell maxWidth="7rem" className="text-[0.6rem]">
                        Timeout
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell maxWidth="7rem" className="text-[0.6rem]">
                        Rounds
                      </Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body className="text-[0.7rem]">
                    {aar.chunk.get().map((aar0, idx) =>
                      aar.accounts[idx].get() ? (
                        <Table.Row key={idx}>
                          <Table.RowHeaderCell
                            maxWidth="10rem"
                            className=" overflow-scroll truncate"
                          >
                            {aar.accounts[idx].email.get()}
                          </Table.RowHeaderCell>
                          <Table.Cell
                            className="overflow-scroll truncate"
                            maxWidth="7rem"
                          >{`${aar0[0]} - ${aar0[1]}`}</Table.Cell>
                          <Table.Cell className="overflow-scroll truncate" maxWidth="5rem">
                            {maxScrapeLimit - aar.accounts[idx].totalScrapedInTimeFrame.get()}
                          </Table.Cell>
                          <Table.Cell className="overflow-scroll truncate" maxWidth="5rem">
                            {timeout}
                          </Table.Cell>
                          <Table.Cell className="overflow-scroll truncate" maxWidth="5rem">
                            {rounds}
                          </Table.Cell>
                        </Table.Row>
                      ) : (
                        <Table.Row key={idx} className="overflow-scroll truncate">
                          <Table.RowHeaderCell maxWidth="10rem" className="overflow-scroll">
                            No Account Available
                          </Table.RowHeaderCell>
                          <Table.Cell
                            className="overflow-scroll truncate"
                            maxWidth="7rem"
                          >{`${aar0[0]} - ${aar0[1]}`}</Table.Cell>
                          <Table.Cell className="overflow-scroll truncate" maxWidth="5rem">
                            -
                          </Table.Cell>
                          <Table.Cell className="overflow-scroll truncate" maxWidth="5rem">
                            {timeout}
                          </Table.Cell>
                          <Table.Cell className="overflow-scroll truncate" maxWidth="5rem">
                            {rounds}
                          </Table.Cell>
                        </Table.Row>
                      )
                    )}
                  </Table.Body>
                </Table.Root>
              )}
            </Flex>
          </Flex>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Close
            </Button>
          </Dialog.Close>
        </Flex>
      </Flex>
    )
  }
)

type TimeoutComp = {
  aar: ObservableObject<{
    rounds: string
    timeout: [string, string, string]
    accounts: { email: string; totalScrapedInTimeFrame: number }[]
    chunk: [min: number, max: number][]
  }>
}

const TimeoutComp = observer(({ aar }: TimeoutComp) => {
  return (
    <>
      <Select.Root
        size="1"
        defaultValue={aar.timeout[0].get()}
        value={aar.timeout[0].get()}
        onValueChange={(e) => aar.timeout[0].set(e)}
      >
        <Select.Trigger placeholder="Hours" />
        <Select.Content>
          <Select.Group>
            <Select.Label>Hours</Select.Label>
            <Select.Item value="0">0 hours</Select.Item>
            <Select.Item value="1">1 hour</Select.Item>
            <Select.Item value="2">2 hours</Select.Item>
            <Select.Item value="3">3 hours</Select.Item>
            <Select.Item value="4">4 hours</Select.Item>
            <Select.Item value="5">5 hours</Select.Item>
            <Select.Item value="6">6 hours</Select.Item>
            <Select.Item value="7">7 hours</Select.Item>
            <Select.Item value="8">8 hours</Select.Item>
            <Select.Item value="9">9 hours</Select.Item>
            <Select.Item value="10">10 hours</Select.Item>
          </Select.Group>
        </Select.Content>
      </Select.Root>

      {/*
          Minutes
        */}

      <Select.Root
        size="1"
        defaultValue={aar.timeout[1].get()}
        value={aar.timeout[1].get()}
        onValueChange={(e) => aar.timeout[1].set(e)}
      >
        <Select.Trigger placeholder="Minutes" />
        <Select.Content>
          <Select.Group>
            <Select.Label>Minutes</Select.Label>
            <Select.Item value="0">0 minutes</Select.Item>
            <Select.Item value="5">5 minutes</Select.Item>
            <Select.Item value="10">10 minutes</Select.Item>
            <Select.Item value="15">15 minutes</Select.Item>
            <Select.Item value="20">20 minutes</Select.Item>
            <Select.Item value="25">25 minutes</Select.Item>
            <Select.Item value="30">30 minutes</Select.Item>
            <Select.Item value="35">35 minutes</Select.Item>
            <Select.Item value="40">40 minutes</Select.Item>
            <Select.Item value="45">45 minutes</Select.Item>
            <Select.Item value="50">50 minutes</Select.Item>
            <Select.Item value="55">55 minutes</Select.Item>
          </Select.Group>
        </Select.Content>
      </Select.Root>

      {/*
          Seconds
        */}

      <Select.Root
        size="1"
        defaultValue={aar.timeout[2].get()}
        value={aar.timeout[2].get()}
        onValueChange={(e) => {
          aar.timeout[2].set(e)
        }}
      >
        <Select.Trigger placeholder="Seconds" />
        <Select.Content>
          <Select.Group>
            <Select.Label>Seconds</Select.Label>
            <Select.Item value="0">0 seconds</Select.Item>
            <Select.Item value="5">5 seconds</Select.Item>
            <Select.Item value="10">10 seconds</Select.Item>
            <Select.Item value="15">15 seconds</Select.Item>
            <Select.Item value="20">20 seconds</Select.Item>
            <Select.Item value="25">25 seconds</Select.Item>
            <Select.Item value="30">30 seconds</Select.Item>
            <Select.Item value="35">35 seconds</Select.Item>
            <Select.Item value="40">40 seconds</Select.Item>
            <Select.Item value="45">45 seconds</Select.Item>
            <Select.Item value="50">50 seconds</Select.Item>
            <Select.Item value="55">55 seconds</Select.Item>
            <Select.Item value="60">60 seconds</Select.Item>
          </Select.Group>
        </Select.Content>
      </Select.Root>
    </>
  )
})

type RoundsComp = {
  aar: ObservableObject<{
    rounds: string
    timeout: [string, string, string]
    accounts: { email: string; totalScrapedInTimeFrame: number }[]
    chunk: [min: number, max: number][]
  }>
}

export const RoundsComp = observer(({ aar }: RoundsComp) => {
  return (
    <Select.Root
      size="1"
      defaultValue={aar.rounds.get()}
      value={aar.rounds.get()}
      onValueChange={(e) => {
        aar.rounds.set(e)
      }}
    >
      <Select.Trigger placeholder="Rounds" />
      <Select.Content>
        <Select.Group>
          <Select.Label>Rounds</Select.Label>
          <Select.Item value="1">1 round</Select.Item>
          <Select.Item value="2">2 rounds</Select.Item>
          <Select.Item value="3">3 rounds</Select.Item>
          <Select.Item value="4">4 rounds</Select.Item>
          <Select.Item value="5">5 rounds</Select.Item>
          <Select.Item value="6">6 rounds</Select.Item>
          <Select.Item value="7">7 rounds</Select.Item>
          <Select.Item value="8">8 rounds</Select.Item>
          <Select.Item value="9">9 rounds</Select.Item>
          <Select.Item value="10">10 rounds</Select.Item>
        </Select.Group>
      </Select.Content>
    </Select.Root>
  )
})
