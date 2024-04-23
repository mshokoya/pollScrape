import { observer, useComputed, useObservable, useSelector } from '@legendapp/state/react'
import { IMetaData, IRecords } from 'src/shared'
import { Box, Flex } from '@radix-ui/themes'
import { appState$ } from '@renderer/core/state'
import { MetadataTable } from './MetadataTable'
import { RecordTable } from './RecordTable'

export const MetadataAndRecordField = observer(() => {
  const metaChecked = useObservable<number[]>([])
  const meta = useSelector(appState$.metas) as IMetaData[]
  const records = useSelector(appState$.records) as IRecords[]

  const filteredRecords = useComputed(() => {
    const filter: string[] = []
    metaChecked.get().forEach((m) => {
      meta[m].scrapes.forEach((d) => filter.push(d.scrapeID))
    })
    return filter.length ? records.filter((r) => filter.includes(r.scrapeID)) : []
  })

  return (
    <Flex className="overflow-scroll grow">
      <Flex gap="2">
        <MetadataTable metaChecked={metaChecked} metas={meta} />
        <RecordTable filteredRecords={filteredRecords} />
      </Flex>
    </Flex>
  )
})
