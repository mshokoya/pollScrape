// import { io } from '../../main'
import { PromptState, deletePrompt, promptState } from '../state/prompt'

type PromptEvent<T> = {
  taskID: string
  type: string
  metadata: T
}

// metadata: {
//   qid: string
//   question: string
//   choices: any[]
//   defaultAnsIDX: number
//   answer: number | null
// }

export function handleAPromptEvents(res: PromptEvent<unknown>) {
  switch (res.type) {
    case 'create':
      promptState.push({ ...(res.metadata as PromptState) }) // put into func in state
      break
  }
}

export const answerPromptEvent = (qid: string, choiceIDX: number) => {
  // io.emit('prompt', { type: 'answer', metadata: { qid, choiceIDX } })
  deletePrompt(qid)
}

// export const startPrompCountdownEvent = (qid: string ) => {
//   io.emit('prompt', {type: 'timer', metadata: {qid, timeLimit: 10000}})
// }
