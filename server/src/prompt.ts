import { Socket } from "socket.io";
import { Mutex } from 'async-mutex';
import { delay, generateID } from "./util";
import { io } from "./websockets";

import Timeout from "smart-timeout";

type Q = {[qid: string]: {question: string, answers: any[], choice: number | null, defaultAnsIDX: number,  timer: Timeout}}

export const Prompt = () => {
  const Q: Q = {};

  const setToDefaultAns = (id: string) => {
    Timeout.clear(id);
    Q[id].choice = Q[id].answers[ Q[id].defaultAnsIDX ];
  };

  const deleteQuestion = (id: string) => {
    Timeout.clear(id);
    delete Q[id];
  };

  const getTimeLeft = (id: string) => Timeout.remaining(id);

  const askQuestion = async (question: string, answers: any[], defaultAnsIDX: number, timeLimit: number) => {
    const qid = generateID()
    const timer = Timeout.set(qid, () => { setToDefaultAns(qid) }, timeLimit);
    Q[qid] = { question, timer, choice: null, answers, defaultAnsIDX };

    while (!Q[qid].choice) await delay(3000);

    const answer = Q[qid].choice;
    deleteQuestion(qid);
    return answer;
  };

  const answerQuestion = (questionID: string, choiceIDX: number) => {
    const answer = Q[questionID] ? Q[questionID].answers[choiceIDX] : undefined;
    if (!answer) false;
    Q[questionID].choice = Q[questionID].answers[choiceIDX];
    return true;
  };

  return {
    askQuestion,
    answerQuestion,
    getTimeLeft,
  };
};

export let prompt: ReturnType<typeof Prompt>
export const initPrompt = () => { prompt = Prompt() }