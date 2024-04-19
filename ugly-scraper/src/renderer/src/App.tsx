import { RecordField } from './components/RecordField'
import { ScrapeField } from './components/ScrapeField'
import { Sidebar } from './components/Sidebar'
import { TaskView } from './components/TaskView'
import { PromptPopup } from './components/Prompt'
import { promptState } from './core/state/prompt'
import { observer } from '@legendapp/state/react'
import { Theme } from '@radix-ui/themes'

const App = observer(() => {
  return (
    <Theme accentColor="gray" grayColor="mauve" radius="small" scaling="90%" appearance="dark">
      <div className="flex relative">
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
    </Theme>
  )
})

export default App
