import { observable } from '@legendapp/state'

export type PromptState = {
  taskID: string
  qid: string
  question: string
  choices: any[]
  defaultAnsIDX: number
  answer: number | null
  timer: NodeJS.Timeout | null
}

export const promptState = observable<PromptState[]>([])

// export const startPromptCountdown = (qid: string, timeLimit?: number) => {

//     const prompt = promptState.find(p => p.qid.peek() === qid)
//     if (!prompt || prompt?.timer.peek()) return
//     console.log('got an timer')

//     prompt.timer.set(
//       setTimeout(() => {
//         answerPromptEvent(qid, prompt.defaultAnsIDX.peek())
//       }, promptCountdownTime )
//     )
//   // startPrompCountdownEvent(prompt.qid.peek(), 10000)
// }

export const deletePrompt = (qid: string) => {
  const prompt = promptState.find((p1) => p1.qid.peek() === qid)
  clearTimeout(prompt?.timer.peek())
  promptState.set((p) => p.filter((p1) => p1.qid !== qid))
}
