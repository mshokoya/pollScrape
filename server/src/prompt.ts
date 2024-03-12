
// ============== remove "smart-timeout" and use native timeout ============
//      example use 

// const now = new Date();
// const later = now.getTime() + 5000
// const fut = new Date(later)
// console.log(now.toLocaleTimeString());
// console.log(fut.toLocaleTimeString());
// // Expected output: 123

// ==========================

// import { Mutex } from 'async-mutex';
import { delay, generateID } from "./util";
import { io } from "./websockets";

type Q = {[qid: string]: {question: string, choices: any[], answer: number | null, defaultAnsIDX: number,  timer: NodeJS.Timeout | null}}

export const Prompt = () => {
  const Q: Q = {};

  const setToDefaultAns = (qid: string) => {
    if (Q[qid]) return
    clearTimeout(Q[qid].timer!)
    Q[qid].answer = Q[qid].defaultAnsIDX;
  };

  const deleteQuestion = (qid: string) => {
    if (Q[qid]) return
    clearTimeout(Q[qid].timer!)
    delete Q[qid];
  };

  const askQuestion = async <T>(question: string, choices: T[], defaultAnsIDX: number) => {
    const qid = generateID()

    Q[qid] = { question, timer: setTimeout(() => { setToDefaultAns(qid) }, 60000), answer: null, choices, defaultAnsIDX };

    io.emit('prompt', {type: 'create', metadata: {...Q[qid], qid, timer: null }})

    while (Q[qid].answer === null) await delay(3000);

    const answer = Q[qid].choices[Q[qid].answer!];
    deleteQuestion(qid);

    return answer;
  };

  const answerQuestion = (qid: string, answerIDX: number) => {
    if (!Q[qid]) return
    const answer = Q[qid].choices[answerIDX];
    if (!answer) false;
    Q[qid].answer = answerIDX;
    return true;
  };

  return {
    askQuestion,
    answerQuestion,
  };
};

export let prompt: ReturnType<typeof Prompt>
export const initPrompt = () => { prompt = Prompt() }