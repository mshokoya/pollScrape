import { ObservableObject, batch } from '@legendapp/state'
import { observer } from '@legendapp/state/react'
import { Button, Dialog, ScrollArea } from '@radix-ui/themes'
import { IMetaData } from '@shared/index'
import { MouseEvent } from 'react'
import { IoOptionsOutline } from 'react-icons/io5'
import { MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md'
import { SlOptionsVertical } from 'react-icons/sl'
import { MetadataDropdown } from './MetadataDropdown'
import { fetchData } from '@renderer/core/util'
import { MetadataPopup } from '../MetadataPopups'
import {
  metadataResStatusHelper,
  metadataState,
  metadataTaskHelper
} from '@renderer/core/state/metadata'
import { CHANNELS } from '../../../../../shared/util'
import { appState$ } from '@renderer/core/state'

type MetaSubCompArgs = {
  metas: IMetaData[]
  metaChecked: ObservableObject<number[]>
}

export const MetadataTable = observer(({ metas, metaChecked }: MetaSubCompArgs) => {
  // const selectedMeta = useObservable<number>(-1)

  const handleExtendRow = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.stopPropagation()
    //@ts-ignore
    const type = e.target.closest('td')?.dataset.type as string
    const metaCheckedState = metaChecked.get()

    switch (type) {
      case 'opt':
        //@ts-ignore
        metadataState.selectedMeta.set(e.target.closest('tr').dataset.idx)
        break
      case 'check': {
        //@ts-ignore
        const idx = parseInt(e.target.closest('tr').dataset.idx)
        metaCheckedState.includes(idx)
          ? metaChecked.set((p) => p.filter((a) => a !== idx))
          : metaChecked.set([...metaCheckedState, idx])
        break
      }
      case 'extend':
        //@ts-ignore
        e.target.closest('tr').nextSibling.classList.toggle('hidden')
        break
    }
  }

  const updateMeta = async (input: Partial<IMetaData>) => {
    // if (rename === meta.name) return
    const metaID = metas[metadataState.selectedMeta.peek()].id
    metadataTaskHelper.add(metaID, { type: 'update', status: 'processing' })
    await fetchData<IMetaData>('meta', CHANNELS.a_metadataUpdate, {
      id: input.id,
      name: input.name
    })
      .then((res) => {
        if (res.ok) {
          metadataResStatusHelper.add(metaID, ['update', 'ok'])
          appState$.metas.find((m) => m.id.peek() === metaID)?.set(res.data)
        } else {
          metadataResStatusHelper.add(metaID, ['update', 'fail'])
        }
      })
      .catch(() => {
        metadataResStatusHelper.add(metaID, ['update', 'fail'])
      })
      .finally(() => {
        setTimeout(() => {
          batch(() => {
            metadataTaskHelper.deleteTaskByReqType(metaID, 'update')
            metadataResStatusHelper.delete(metaID, 'update')
          })
        }, 1500)
      })
  }

  const continueScraping = () => {
    const metaID = metas[metadataState.selectedMeta.peek()].id
    metadataTaskHelper.add(metaID, { type: 'continue', status: 'processing' })
    fetchData('meta', CHANNELS.a_scrape, { id: metaID })
  }

  // create warning popup
  const deleteMeta = async () => {
    // if (rename === meta.name) return
    const metaID = metas[metadataState.selectedMeta.peek()].id
    metadataTaskHelper.add(metaID, { type: 'delete', status: 'processing' })
    await fetchData<IMetaData>('meta', CHANNELS.a_metadataDelete, { id: metaID })
      .then((res) => {
        if (res.ok) {
          metadataResStatusHelper.add(metaID, ['delete', 'ok'])
          appState$.metas.set((m1) => m1.filter((m2) => m2.id !== metaID))
        } else {
          metadataResStatusHelper.add(metaID, ['delete', 'fail'])
        }
      })
      .catch(() => {
        metadataResStatusHelper.add(metaID, ['delete', 'fail'])
      })
      .finally(() => {
        setTimeout(() => {
          batch(() => {
            metadataTaskHelper.deleteTaskByReqType(metaID, 'delete')
            metadataResStatusHelper.delete(metaID, 'delete')
          })
        }, 1500)
      })
  }

  const handleMetaToggle = () => {
    metaChecked.get().length === metas.length
      ? metaChecked.set([])
      : metaChecked.set(metas.map((_, idx) => idx))
  }

  return (
    <Dialog.Root>
      <div className="border-[#2f3135] basis-1/3 border rounded grow overflow-auto">
        <ScrollArea type="always">
          <table className=" w-[150%] table-fixed overflow-auto">
            <thead className="sticky top-0 bg-[#202226] text-[0.8rem] z-10">
              <tr>
                <th className="sticky left-0 p-1.5 w-[3%] bg-[#202226]" onClick={handleMetaToggle}>
                  {metaChecked.get().length === metas.length ? (
                    <MdCheckBox className="bg-[#202226] inline" />
                  ) : (
                    <MdCheckBoxOutlineBlank className="inline" />
                  )}
                </th>
                <th className="p-2"> Name </th>
                <th className="p-2"> Url </th>
                <th className="w-[2rem] sticky bg-[#202226] right-0">
                  <IoOptionsOutline className="inline" />
                </th>
              </tr>
            </thead>
            <tbody className="text-[0.9rem] text-center" onClick={handleExtendRow}>
              {metas.length &&
                metas.map((m, idx) => (
                  <>
                    <tr
                      className="text-[0.8rem] text-center hover:border-cyan-600 hover:border"
                      data-idx={idx}
                      key={idx}
                    >
                      <td className="sticky left-0 bg-[#111111]" data-type="check" data-idx={idx}>
                        {metaChecked.get().includes(idx) ? (
                          <MdCheckBox className="bg-[#111111] inline" />
                        ) : (
                          <MdCheckBoxOutlineBlank className="bg-[#111111] inline" />
                        )}
                      </td>

                      <td className="overflow-scroll truncate" data-type="extend">
                        {m.name}
                      </td>
                      <td className="overflow-scroll truncate" data-type="extend">
                        {m.url}
                      </td>
                      <td className="overflow-scroll sticky bg-[#111111] right-0" data-type="opt">
                        <Dialog.Trigger>
                          <Button color="gray" variant="outline" size="1">
                            <SlOptionsVertical className="inline" />
                          </Button>
                        </Dialog.Trigger>
                      </td>
                    </tr>
                    <MetadataDropdown meta={m} />
                  </>
                ))}
            </tbody>
          </table>
        </ScrollArea>
      </div>
      {/*
                  DIALOG CONTENT
          */}

      <Dialog.Content maxWidth="450px">
        {metadataState.selectedMeta.get() && (
          <MetadataPopup
            meta={metas[metadataState.selectedMeta.get()]}
            updateMeta={updateMeta}
            continueScraping={continueScraping}
            deleteMeta={deleteMeta}
          />
        )}
      </Dialog.Content>
    </Dialog.Root>
  )
})
