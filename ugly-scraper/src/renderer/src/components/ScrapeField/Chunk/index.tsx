import { ObservableObject } from '@legendapp/state'
import { observer } from '@legendapp/state/react'
import { Box, Flex, Separator, Table, Text, Dialog } from '@radix-ui/themes'
import { IoArrowUp, IoOptionsOutline } from 'react-icons/io5'
import { IoArrowDown } from 'react-icons/io5'
import { ChunkDialog } from './Dialog'

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

export const Chunk = observer(
  ({ aar, chunkParts, handleChunkPart, maxScrapeLimit, chunkingInProcess }: ChunkCompProps) => {
    if (!aar.chunk.get().length) return <div></div>

    return (
      <Dialog.Root>
        <Flex direction="column" align="center" gap="2">
          <Text size="2">Accounts For Scrape</Text>
          <Flex direction="column" overflow="scroll" className="h-[10rem]">
            <Flex justify="between" align="center">
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

              <Dialog.Trigger>
                <IoOptionsOutline className="inline" />
              </Dialog.Trigger>
            </Flex>
            <Box width="7rem">
              <Separator orientation="horizontal" mt="2" mb="1" size="4" />
            </Box>

            <Flex overflow="scroll" flexGrow="1">
              {aar.chunk?.length && (
                <Table.Root size="1">
                  <Table.Header className="sticky top-0 bg-[#111111]">
                    <Table.Row>
                      <Table.ColumnHeaderCell maxWidth="10rem" className="text-[0.7rem]">
                        Accounts
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell maxWidth="7rem" className="text-[0.7rem]">
                        Range
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell maxWidth="4.5rem" className="text-[0.6rem]">
                        Total leads
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
                            {/* {console.log(aar.accounts[idx].email.get())} */}
                            {aar.accounts[idx].email.get()}
                          </Table.RowHeaderCell>
                          <Table.Cell
                            className="overflow-scroll truncate text-[0.6rem]"
                            maxWidth="7rem"
                          >{`${aar0[0]} - ${aar0[1]}`}</Table.Cell>
                          <Table.Cell className="overflow-scroll truncate" maxWidth="5rem">
                            {maxScrapeLimit - aar.accounts[idx].totalScrapedInTimeFrame.get()}
                          </Table.Cell>
                        </Table.Row>
                      ) : (
                        <Table.Row key={idx} className="overflow-scroll truncate">
                          <Table.RowHeaderCell
                            maxWidth="10rem"
                            className="overflow-scroll text-[0.5rem]"
                          >
                            No Account Available
                          </Table.RowHeaderCell>
                          <Table.Cell
                            className="overflow-scroll truncate text-[0.6rem]"
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

        <Dialog.Content maxWidth="700px">
          {aar.chunk.get()?.length && (
            <ChunkDialog
              chunkingInProcess={chunkingInProcess}
              aar={aar}
              chunkParts={chunkParts}
              handleChunkPart={handleChunkPart}
              maxScrapeLimit={maxScrapeLimit}
            />
          )}
        </Dialog.Content>
      </Dialog.Root>
    )
  }
)
