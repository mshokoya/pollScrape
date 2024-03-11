import { observer } from '@legendapp/state/react';
import { answerPromptEvent} from '../core/io/prompt';
import {PromptState, startPromptCountdown} from '../core/state/prompt';
import { useEffect } from 'react';

type Props = {
  prompt: PromptState
}

export const PromptPopup = observer(({prompt}: Props ) => {
  useEffect(() => {
    startPromptCountdown(prompt.qid)
  }, [prompt.qid])

  const answerPrompt = (idx: any) => {
    answerPromptEvent(prompt.qid, idx)
  }

  return (
    <div className="flex items-center justify-center absolute top-0 left-0 right-0 bottom-0 z-20" style={{background: "rgba(0,0,0,.70)"}} >
      <div className="relative w-[30%] h-[30%] z-20 border-cyan-600 border-2 bg-black flex flex-col " onClick={e => e.stopPropagation()}>
        <div className='text-center border-b-2 border-cyan-600 mb-2'> {prompt.question}</div>
        {
          prompt.choices.map((p, idx) => (<div key={idx} onClick={() => answerPrompt(idx) }>{p}</div>))
        }
      </div>
    </div>
  )
})