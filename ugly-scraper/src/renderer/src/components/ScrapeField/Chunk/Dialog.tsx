import { ObservableObject } from '@legendapp/state'
import { observer } from '@legendapp/state/react'
import { Button, Dialog, Flex, Text, Table, Separator, Box, Select } from '@radix-ui/themes'
import { IoArrowDown, IoArrowUp } from 'react-icons/io5'

export type ChunkCompProps = {
  aar: ObservableObject<{
    rounds: number
    timeout: [string, string, string, string]
    accounts: { email: string; totalScrapedInTimeFrame: number; timeout: number; rounds: number }[]
    chunk: [min: number, max: number][]
  }>
  maxScrapeLimit: number
  chunkParts: number
  handleChunkPart: (val: 'inc' | 'dec') => void
  chunkingInProcess: boolean
}

export const ChunkDialog = observer(
  ({ aar, chunkParts, handleChunkPart, maxScrapeLimit, chunkingInProcess }: ChunkCompProps) => {
    const handleTimeoutSelect = (pos: string, e: any) => {
      aar.timeout[parseInt(pos)].set(e)
    }

    console.log(aar.get())

    return (
      <Flex direction="column" height="500px">
        <Dialog.Title>Accounts For Scrape</Dialog.Title>
        {/* <Dialog.Description size="2" mb="4">
          Make changes to your profile.
        </Dialog.Description> */}
        <Flex gap="2">
          <Text>Timeout:</Text>
          <TimeoutComp aar={aar} handleTimeoutSelect={handleTimeoutSelect} />
        </Flex>

        <Flex direction="column" gap="2" align="center">
          <Flex direction="column" overflow="scroll">
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
                <Table.Root size="1" className="w-[600px] h-[360px]">
                  <Table.Header className="sticky top-0 bg-[#111111]">
                    <Table.Row>
                      <Table.ColumnHeaderCell maxWidth="10rem" className="text-[0.7rem]">
                        Accounts
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell maxWidth="7rem" className="text-[0.7rem]">
                        Range
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell maxWidth="7rem" className="text-[0.6rem]">
                        Estimated Scrape
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
)

type TimeoutComp = {
  aar: ObservableObject<{
    rounds: number
    timeout: [string, string, string, string]
    accounts: { email: string; totalScrapedInTimeFrame: number; timeout: number; rounds: number }[]
    chunk: [min: number, max: number][]
  }>
  handleTimeoutSelect: (pos: number, e: any) => void
}

const TimeoutComp = observer(({ handleTimeoutSelect, aar }: TimeoutComp) => {
  return (
    <>
      <Select.Root
        size="1"
        defaultValue={aar.timeout[0].get()}
        value={aar.timeout[0].get()}
        onValueChange={(e) => handleTimeoutSelect(0, e)}
      >
        <Select.Trigger placeholder="Days" />
        <Select.Content>
          <Select.Group>
            <Select.Label>Days</Select.Label>
            <Select.Item value="0">0 days</Select.Item>
            <Select.Item value="1">1 day</Select.Item>
            <Select.Item value="2">2 days</Select.Item>
            <Select.Item value="3">3 days</Select.Item>
            <Select.Item value="4">4 days</Select.Item>
            <Select.Item value="5">5 days</Select.Item>
          </Select.Group>
        </Select.Content>
      </Select.Root>

      {/*

         hours

          */}

      <Select.Root
        size="1"
        defaultValue={aar.timeout[1].get()}
        value={aar.timeout[1].get()}
        onValueChange={(e) => handleTimeoutSelect(1, e)}
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
        defaultValue={aar.timeout[2].get()}
        value={aar.timeout[2].get()}
        onValueChange={(e) => handleTimeoutSelect(2, e)}
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
        defaultValue={aar.timeout[3].get()}
        value={aar.timeout[3].get()}
        onValueChange={(e) => handleTimeoutSelect(3, e)}
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
