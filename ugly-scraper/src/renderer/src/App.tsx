// import { RecordField } from './components/Records/RecordField'
// import { ScrapeField } from './components/ScrapeField'
import { Sidebar } from './components/Sidebar'
// import { TaskView } from './components/TaskView'
import { PromptPopup } from './components/Prompt'
import { promptState } from './core/state/prompt'
import { observer } from '@legendapp/state/react'
import { Theme } from '@radix-ui/themes'
import { taskQueue } from './core/state/taskQueue'

const App = observer(() => {
  const addToQueue = () => {
    taskQueue.queue.push({
      taskID: crypto.randomUUID(),
      taskType: 'enqueue',
      taskGroup: 'apollo',
      processes: []
    })
  }
  return (
    <Theme accentColor="gray" grayColor="mauve" radius="small" scaling="90%" appearance="dark">
      {/* <button
        onClick={() => {
          addToQueue()
        }}
      >
        add to queue
      </button> */}
      <a className="ugly-download hidden" />
      <div className="flex relative">
        <div className="flex flex-col center h-screen z-0 w-full p-2">
          {/* <TaskView /> */}
          {/* <ScrapeField /> */}
          {/* <RecordField /> */}
        </div>
        <div>
          <Sidebar />
        </div>
        {promptState.get().length ? <PromptPopup prompt={promptState[0].get()} /> : null}
      </div>
    </Theme>
  )
})

export default App
