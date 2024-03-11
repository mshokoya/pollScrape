import { observable } from "@legendapp/state";
import { answerPromptEvent } from "../io/prompt";

type State = {
  taskID: string
  qid: string
  question: string
  choices: any[]
  defaultAnsIDX: number
  answer: number | null
  timer: NodeJS.Timeout | null
}[]


export const promptState = observable<State>([])

export const startPromptCountdown = (qid: string) => {
  const prompt = promptState.find(p => p.qid.peek() === qid)
  if (!prompt || prompt?.timer) return

  prompt.timer.set(
    setTimeout(() => {
      answerPromptEvent(qid, prompt.defaultAnsIDX.peek())
    }, 10000)
  )
}

export const deletePrompt = (qid: string) => {
  promptState.find(p => p.qid.peek() === qid)?.delete()
}