import { Flex, Table, Text } from '@radix-ui/themes'
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
        <Flex overflow="scroll" flexGrow="1">
          {aar.chunk?.length && (
            <Table.Root size="1" cl>
              <Table.Header className="sticky top-0 bg-[#111111]">
                <Table.Row>
                  <Table.ColumnHeaderCell className="text-[0.7rem]">
                    Accounts
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell className="text-[0.7rem]">Range</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell className="text-[0.6rem]">
                    Estimated Scrape
                  </Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body className="text-[0.7rem]">
                {aar.chunk.map((aar0, idx) =>
                  aar.accounts[idx] ? (
                    <Table.Row key={idx}>
                      <Table.RowHeaderCell className=" overflow-scroll truncate max-w-2">
                        {aar.accounts[idx].email}
                      </Table.RowHeaderCell>
                      <Table.Cell className="overflow-scroll truncate max-w-2">{`${aar0[0]} - ${aar0[1]}`}</Table.Cell>
                      <Table.Cell className="overflow-scroll truncate max-w-2">
                        {maxScrapeLimit - aar.accounts[idx].totalScrapedInTimeFrame}
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    <Table.Row key={idx}>
                      <Table.RowHeaderCell className="overflow-scroll truncate">
                        No Account Available
                      </Table.RowHeaderCell>
                      <Table.Cell className="overflow-scroll truncate">{`${aar0[0]} - ${aar0[1]}`}</Table.Cell>
                      <Table.Cell className="overflow-scroll truncate"> - </Table.Cell>
                    </Table.Row>
                  )
                )}

                <Table.Row>
                  <Table.RowHeaderCell>Zahra Ambessa</Table.RowHeaderCell>
                  <Table.Cell>zahra@example.com</Table.Cell>
                  <Table.Cell>Admin</Table.Cell>
                </Table.Row>

                <Table.Row>
                  <Table.RowHeaderCell>Jasper Eriksson</Table.RowHeaderCell>
                  <Table.Cell>jasper@example.com</Table.Cell>
                  <Table.Cell>Developer</Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table.Root>
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}
