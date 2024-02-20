import generator from 'generate-password';

export function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

export const isNumber = (value: any) => {
  return typeof value === 'number';
}

export const getDomain = (email: string) => {
  const d = email.split('@')[1];
  const domain = d.split('.')[0];

  return domain;
}

export const generateID = (length: number = 15) => generator.generate({length, numbers: true})

export class AppError extends Error {
  constructor(protected taskID: string, message: string) {
    super(message);
    this.name = "AppError";
    this.taskID = taskID
  }
}