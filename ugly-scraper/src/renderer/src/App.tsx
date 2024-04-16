import { RecordField } from './components/RecordField'
import { ScrapeField } from './components/ScrapeField'
import { Sidebar } from './components/Sidebar'
import { TaskView } from './components/TaskView'
import { PromptPopup } from './components/Prompt'
import { promptState } from './core/state/prompt'
import { observer } from '@legendapp/state/react'
import { taskQueue } from './core/io/taskqueue'
import { scrapeTaskQueue } from './core/io/scrapequeue'
import { accountState } from './core/state/account'

const App = observer(function App() {
  return (
    <div className="flex relative">
      <button onClick={() => console.log(taskQueue.get())}> taskQueue </button>
      <button onClick={() => console.log(scrapeTaskQueue.get())}> scrapeTaskQueue </button>
      <button onClick={() => console.log(accountState.get())}> accountState </button>
      <div className="flex flex-col center h-screen z-0 w-full p-2">
        <TaskView />
        <ScrapeField />
        <RecordField />
      </div>
      <div>
        <Sidebar />
      </div>
      {promptState.get().length ? <PromptPopup prompt={promptState[0].get()} /> : null}
    </div>
  )
})

export default App
