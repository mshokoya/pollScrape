
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

  const setToDefaultAns = (qid: string) => {
    if (Q[qid]) return
    Timeout.clear(qid);
    Q[qid].answer = Q[qid].defaultAnsIDX;
  };

  const deleteQuestion = (qid: string) => {
    if (Q[qid]) return
    Timeout.clear(qid);
    delete Q[qid];
  };

  const getTimeLeft = (id: string) => Timeout.remaining(id);

  const askQuestion = async <T>(question: string, choices: T[], defaultAnsIDX: number) => {
    const qid = generateID()
    Q[qid] = { question, timer: null, answer: null, choices, defaultAnsIDX };

    io.emit('prompt', {type: 'create', ...Q[qid], qid, timer: Timeout.set(qid, () => { setToDefaultAns(qid) }, 60000)})


    while (Q[qid].answer === null) await delay(3000);

    const answer = Q[qid].choices[Q[qid].answer!];
    deleteQuestion(qid);

    console.log('AAANNNSSSWWWEERRR')
    console.log(answer)
    return answer;
  };

  const answerQuestion = (qid: string, answerIDX: number) => {
    if (!Q[qid]) return
    const answer = Q[qid].choices[answerIDX];
    if (!answer) false;
    Q[qid].answer = answerIDX;
    return true;
  };

  // const startTimer = (qid: string, timeLimit: number) => {
  //   console.log('timer started')
  //   console.log(timeLimit)
  //   Q[qid].timer = Timeout.set(qid, () => { setToDefaultAns(qid) }, timeLimit);
  // }

  return {
    askQuestion,
    answerQuestion,
    getTimeLeft,
    // startTimer
  };
};

export let prompt: ReturnType<typeof Prompt>
export const initPrompt = () => { prompt = Prompt() }