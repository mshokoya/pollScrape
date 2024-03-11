import { io } from "../../main"
import { deletePrompt, promptState } from "../state/prompt"

type PromptEvent = {
  taskID: string
  qid: string
  question: string
  choices: any[]
  defaultAnsIDX: number
  answer: number | null
}

export function handleAPromptEvents (res: PromptEvent) { 
  promptState.push({...res, timer: null}) 
}

export const answerPromptEvent = (qid: string, choiceIDX: number) => {
  io.emit('prompt', {type: 'answer', data: {qid, choiceIDX}})
  deletePrompt(qid)
}

export const startPrompTimer = (qid: string, timeLimit?: number) => {
  io.emit('prompt', {type: 'timer', data: {qid, timeLimit: timeLimit || 10000}})
}