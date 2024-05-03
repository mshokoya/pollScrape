import { ObservableObject } from '@legendapp/state'
import { observer } from '@legendapp/state/react'
import { Button, Dialog, Flex, Text, Table, Separator, Box } from '@radix-ui/themes'
import { IoArrowDown, IoArrowUp } from 'react-icons/io5'

export type ChunkCompProps = {
  aar: ObservableObject<{
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
    return (
      <Box>
        <Dialog.Title>Accounts For Scrape</Dialog.Title>
        {/* <Dialog.Description size="2" mb="4">
          Make changes to your profile.
        </Dialog.Description> */}

        <Flex direction="column" align="center" gap="2">
          <Text size="2">Accounts For Scrape</Text>
          <Flex direction="column" overflow="scroll" className="h-[10rem]">
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

            <Flex overflow="scroll" flexGrow="1">
              {aar.chunk?.get().length && (
                <Table.Root size="1">
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
                            {aar.accounts[idx].timeout.get()}
                          </Table.Cell>
                          <Table.Cell className="overflow-scroll truncate" maxWidth="5rem">
                            {aar.accounts[idx].rounds.get()}
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
                            -
                          </Table.Cell>
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
      </Box>
    )
  }
)
