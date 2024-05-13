// import { RecordField } from './components/Records/RecordField'
// import { ScrapeField } from './components/ScrapeField'
import { Sidebar } from './components/Sidebar'
// import { TaskView } from './components/TaskView'
import { PromptPopup } from './components/Prompt'
import { promptState } from './core/state/prompt'
import { observer } from '@legendapp/state/react'
import { Flex, Theme } from '@radix-ui/themes'
import { TaskView } from './components/TaskQueueBar/TaskView'
import { MetadataAndRecordField } from './components/MetadataRecords'
import { ScrapeField } from './components/ScrapeField'
import { appState$ } from './core/state'
import { taskQueue } from './core/state/taskQueue'
// import { CHANNELS } from '../../shared/util'
// import { accountState } from './core/state/account'

const App = observer(() => {
  const viewForks = async () => {
    // console.log(await window['fork'][CHANNELS.fork_get]())
    console.log(taskQueue.get())
  }

  const viewQueues = async () => {
    // console.log(await window['fork'][CHANNELS.taskQueue_queues]())
  }

  return (
    <Theme accentColor="gray" grayColor="mauve" radius="small" scaling="90%" appearance="dark">
      <button onClick={() => viewQueues()}>view queues</button>
      <button onClick={() => viewForks()}>view forks</button>
      <a className="ugly-download hidden" />
      <div className="flex relative">
        <Flex direction="column" className=" center h-screen z-0 w-full p-2" gap="3">
          <TaskView />
          <ScrapeField />
          <MetadataAndRecordField />
        </Flex>
        <div>
          <Sidebar />
        </div>
        {promptState.get().length ? <PromptPopup prompt={promptState[0].get()} /> : null}
      </div>
    </Theme>
  )
})

export default App
