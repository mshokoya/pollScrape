import { Box, Flex, Separator, Table, Text } from '@radix-ui/themes'
import { IoArrowUp } from 'react-icons/io5'
import { IoArrowDown } from 'react-icons/io5'

export type ChunkCompProps = {
  aar: {
    accounts: { email: string; totalScrapedInTimeFrame: number }[]
    chunk: [min: number, max: number][]
  }
  maxScrapeLimit: number
  chunkParts: number
  handleChunkPart: (val: 'inc' | 'dec') => void
}

export const Chunk = ({ aar, chunkParts, handleChunkPart, maxScrapeLimit }: ChunkCompProps) => {
  if (!aar.chunk.length) return <div></div>

  return (
    <Flex direction="column" align="center" gap="2">
      <Text size="2">Accounts For Scrape</Text>
      <Flex direction="column" overflow="scroll" className="h-[10rem]">
        <Flex gap="3" className="text-[0.8rem]">
          <Text>Chunk:</Text>
          <span
            onClick={() => {
              handleChunkPart('dec')
            }}
          >
            <IoArrowDown />
          </span>
          <span> {chunkParts} </span>
          <span
            onClick={() => {
              handleChunkPart('inc')
            }}
          >
            <IoArrowUp />
          </span>
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
                  <Table.ColumnHeaderCell maxWidth="7rem" className="text-[0.6rem]">
                    Estimated Scrape
                  </Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body className="text-[0.7rem]">
                {aar.chunk.map((aar0, idx) =>
                  aar.accounts[idx] ? (
                    <Table.Row key={idx}>
                      <Table.RowHeaderCell maxWidth="10rem" className=" overflow-scroll truncate">
                        {aar.accounts[idx].email}
                      </Table.RowHeaderCell>
                      <Table.Cell
                        className="overflow-scroll truncate"
                        maxWidth="7rem"
                      >{`${aar0[0]} - ${aar0[1]}`}</Table.Cell>
                      <Table.Cell className="overflow-scroll truncate" maxWidth="5rem">
                        {maxScrapeLimit - aar.accounts[idx].totalScrapedInTimeFrame}
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
  )
}
