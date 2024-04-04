// import { RecordField } from './components/RecordField'
// import { ScrapeField } from './components/ScrapeField'
// import { Sidebar } from './components/Sidebar'
// import { TaskView } from './components/TaskView'
// import { PromptPopup } from './components/Prompt'
// import { promptState } from './core/state/prompt'
// import { observer } from '@legendapp/state/react'

// const App = observer(function App() {
//   return (
//     <div className="flex relative">
//       <div className="flex flex-col center h-screen z-0 w-full p-2">
//         <TaskView />
//         <ScrapeField />
//         <RecordField />
//       </div>
//       <div>
//         <Sidebar />
//       </div>
//       {promptState.get().length ? <PromptPopup prompt={promptState[0].get()} /> : null}
//     </div>
//   )
// })

// export default App



function App(): JSX.Element {

  const handleAccountGetAll = async () => {
    console.log('llooll tess')
    console.log(window.account)
  }

  // const handleAccountCreate = async () => {
  //   await window.account.accountCreate()
  //     .then((r) => {
  //       console.log('its eya: ' + r)
  //     })
  //     .catch((r) => {
  //       console.log('its errr: ' + r)
  //     })
  // }

  // const handleAccountFindOne = async () => {
  //   console.log('its eya: ' + await window.account.accountFindOne())
  // }

  // const handleAccountFindById = async () => {
  //   console.log('its eya: ' + await window.account.accountFindById())
  // }

  // const handleAccountFindOneAndUpdate = async () => {
  //   console.log('its eya: ' + await window.account.accountFindOneAndUpdate())
  // }

  // const handleAccountFindOneAndDelete = async () => {
  //   console.log('its eya: ' + await window.account.accountFindOneAndDelete())
  // }

  return (
    <div>
      <div className="bg-amber-600" onClick={() => handleAccountGetAll()}>gettall</div>
      {/* <div className="bg-amber-600" onClick={() => handleAccountCreate()}>create</div>
      <div className="bg-amber-600" onClick={() => handleAccountFindOne()}>findone</div>
      <div className="bg-amber-600" onClick={() => handleAccountFindById()}>findbyid</div>
      <div className="bg-amber-600" onClick={() => handleAccountFindOneAndUpdate()}>findoneanupdate</div>
      <div className="bg-amber-600" onClick={() => handleAccountFindOneAndDelete()}>findoneanddelete</div> */}
    </div>
  )
}

export default App
