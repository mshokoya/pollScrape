import { Memo, observer, useComputed, useObservable } from '@legendapp/state/react'
import { answerPromptEvent } from '../core/io/prompt'
import { PromptState } from '../core/state/prompt'
import { useEffect } from 'react'
import { promptCountdownTime } from '../core/util'

type Props = {
  prompt: PromptState
}

export const PromptPopup = observer(({ prompt }: Props) => {
  const total = useObservable(promptCountdownTime)
  const countdown = useComputed(() => (total.get() / 1000) % 60)

  let clear: NodeJS.Timeout

  useEffect(() => {
    total.set(promptCountdownTime)

    // eslint-disable-next-line react-hooks/exhaustive-deps
    clear = setInterval(() => {
      const t = total.peek()
      total.set(t - 1000)
      if (countdown.peek() === 0) {
        answerPromptEvent(prompt.qid, prompt.defaultAnsIDX)
        clearInterval(clear)
      }

      return () => {
        clearInterval(clear)
      }
    }, 1000)
  }, [prompt.qid])

  const answerPrompt = (idx: any) => {
    answerPromptEvent(prompt.qid, idx)
    clearInterval(clear)
  }

  return (
    <div
      className="flex items-center justify-center absolute top-0 left-0 right-0 bottom-0 z-20"
      style={{ background: 'rgba(0,0,0,.70)' }}
    >
      <div
        className="relative w-[30%] h-[30%] z-20 border-cyan-600 border-2 bg-black flex flex-col "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center border-b-2 border-cyan-600 mb-2"> {prompt.question}</div>
        <div>
          <Memo>{countdown}</Memo>
        </div>
        {prompt.choices.map((p, idx) => (
          <div key={idx} onClick={() => answerPrompt(idx)}>
            {p}
          </div>
        ))}
      </div>
    </div>
  )
})
