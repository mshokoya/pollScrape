import { observer, useObservable, useSelector } from '@legendapp/state/react'
import { IMetaData, IRecords } from 'src/shared'
import { Flex } from '@radix-ui/themes'
import { ObservableObject } from '@legendapp/state'
import { appState$ } from '@renderer/core/state'
import { MetadataTable } from './MetadataTable'

// type RecordsDispatch = Dispatch<SetStateAction<IRecords[]>>
type RecordsSubCompArgs = {
  records: IRecords[]
  recordsChecked: ObservableObject<number[]>
  meta: IMetaData[]
  metaChecked: ObservableObject<number[]>
}

export const MetadataAndRecordField = observer(() => {
  const metaChecked = useObservable<number[]>([])
  // const recordsChecked = useObservable<number[]>([])
  const meta = useSelector(appState$.metas) as IMetaData[]
  // const records = useSelector(appState$.records) as IRecords[]

  // const filteredRecords = useComputed(() => {
  //   const filter: string[] = []
  //   metaChecked.get().forEach((m) => {
  //     meta[m].scrapes.forEach((d) => filter.push(d.scrapeID))
  //   })
  //   return filter.length ? records.filter((r) => filter.includes(r.scrapeID)) : []
  // })

  return (
    <Flex className="relative grow text-xs">
      <Flex direction="column" flexGrow="1" className="absolute inset-x-0 inset-y-0">
        <MetadataTable metaChecked={metaChecked} metas={meta} />
      </Flex>
    </Flex>
  )
})
