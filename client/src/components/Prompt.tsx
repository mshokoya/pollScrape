import { answerPromptEvent, startPrompTimer } from '@/core/io/prompt';
import {promptState} from '../core/state/prompt';

export const PromptPopup = () => {
  const prompt = promptState.get()[0]
  startPrompTimer(prompt.qid)

  const answerPrompt = (idx: any) => {
    answerPromptEvent(prompt.qid, idx)
  }

  return (
    <div className="flex items-center justify-center fixed top-0 left-0 right-0 bottom-0 z-10" style={{background: "rgba(0,0,0,.70)"}} >
      <div className="relative w-[30%] h-[30%] z-20 border-cyan-600 border-2 bg-black flex flex-col" onClick={e => e.stopPropagation()}>
        <div className='text-center border-b-2 border-cyan-600 mb-2'> {prompt.question}</div>
        {
          prompt.choices.map((p, idx) => (<div key={idx} onClick={() => answerPrompt(idx) }>{p}</div>))
        }
      </div>
    </div>
  )
}