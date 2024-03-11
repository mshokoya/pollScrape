
// ============== remove "smart-timeout" and use native timeout ============
//      example use 

// const now = new Date();
// const later = now.getTime() + 5000
// const fut = new Date(later)
// console.log(now.toLocaleTimeString());
// console.log(fut.toLocaleTimeString());
// // Expected output: 123

// ==========================

import { Mutex } from 'async-mutex';
import { delay, generateID } from "./util";
import { io } from "./websockets";

import Timeout from "smart-timeout";

type Q = {[qid: string]: {question: string, choices: any[], answer: number | null, defaultAnsIDX: number,  timer: Timeout | null}}

export const Prompt = () => {
  const Q: Q = {};

  Timeout.meta

  const setToDefaultAns = (id: string) => {
    Timeout.clear(id);
    Q[id].answer = Q[id].defaultAnsIDX;
  };

  const deleteQuestion = (id: string) => {
    Timeout.clear(id);
    delete Q[id];
  };

  const getTimeLeft = (id: string) => Timeout.remaining(id);

  const askQuestion = async <T>(question: string, choices: T[], defaultAnsIDX: number) => {
    const qid = generateID()
    Q[qid] = { question, timer: null, answer: null, choices, defaultAnsIDX };

    io.emit('prompt', {...Q[qid], qid})

    while (!Q[qid].answer) await delay(3000);

    const answer = Q[qid].choices[Q[qid].answer!];
    deleteQuestion(qid);
    return answer;
  };

  const answerQuestion = (qid: string, answerIDX: number) => {
    const answer = Q[qid] ? Q[qid].choices[answerIDX] : undefined;
    if (!answer) false;
    Q[qid].answer = Q[qid].choices[answerIDX];
    return true;
  };

  const startTimer = (qid: string, timeLimit: number) => {
    Q[qid].timer = Timeout.set(qid, () => { setToDefaultAns(qid) }, timeLimit);
  }

  return {
    askQuestion,
    answerQuestion,
    getTimeLeft,
    startTimer
  };
};

export let prompt: ReturnType<typeof Prompt>
export const initPrompt = () => { prompt = Prompt() }