import { RecordField } from './components/RecordField';
import { ScrapeField } from './components/ScrapeField';
import { Sidebar } from './components/Sidebar';


function App() {

  return (
    <div className='flex'>

      <div className='flex flex-col center h-screen z-0 grow p-2'>
        <div className='mb-4 text-center'>
          <ScrapeField />
        </div>

        <div className='flex flex-auto space-x-4'>
          {/* RECORDS */}
          <div className='flex flex-col basis-full'>
            <RecordField />
          </div>
        </div>
      </div>

      <div className=''>
        <Sidebar />
      </div>
      
    </div>
  )
}

export default App