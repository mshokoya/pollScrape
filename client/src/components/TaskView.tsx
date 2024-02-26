import { RiGhostLine } from "react-icons/ri";
import { BiSolidGhost } from "react-icons/bi";
import { TaskQueueSocketEvent, taskQueue } from "../core/io/taskqueue"
import { useObservable, useSelector } from "@legendapp/state/react"
import { Tooltip } from 'react-tooltip'

export const TaskView = () => {
  const tq = useSelector(taskQueue)
  const l = useObservable<TaskQueueSocketEvent>()


  return (
    <div className='w-full h-10 bg-cyan-600'>
      <div>
          { 
            tq.timeout && tq.timeout.map((t, idx) => <div key={idx} id="clickable" className='text-3xl ghost inline-block' onMouseOver={() => l.set(t)}><BiSolidGhost /></div> )
          }
          <span className='text-3xl font-bold inline'>( </span>
          { 
            tq.processing && tq.processing.map((t, idx) => <div key={idx} id="clickable" className='ghost-float text-3xl ghost inline-block' onMouseOver={() => l.set(t)}><RiGhostLine /></div> )
          }
          <span className='text-3xl font-bold inline'> )</span>
          { 
            tq.queue && tq.queue.map((t, idx) => <div key={idx} id="clickable" className='ghost-float text-3xl ghost inline-block' onMouseOver={() => l.set(t)}><BiSolidGhost /> </div>)
          }
          <Tooltip anchorSelect="#clickable" place="bottom-end" clickable>
            <div>Task Type: {l.taskType.get()}</div>
            <div>Message: {l.message.get()}</div>
            <div>Task Group: {l.metadata.taskGroup.get()}</div>
            <div>Task ID: {l.metadata.taskID.get()}</div>
            <div>Metadata Task Type: {l.metadata.taskType.get()}</div>
            <div>Metadata AccountID: {l.metadata.metadata.accountID.get()}</div>
          </Tooltip>
      </div>
      
    </div>
  )
}