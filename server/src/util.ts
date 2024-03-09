import generator from 'generate-password';
import { generateSlug as gs } from 'random-word-slugs';

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

export const generateSlug = (n?: number) => gs(n)

export const generateID = (length: number = 15) => generator.generate({length, numbers: true})

export const getRangeFromApolloURL = (url: string) => {
  const pURL = new URLSearchParams(url.split('/#/people?')[1]);
  const range = pURL.getAll('organizationNumEmployeesRanges[]')
  if (!range.length) return []
  return range.map(r => r.split(','))
}

export const setRangeInApolloURL = (url: string, range: [number, number]) => {
  const params = new URLSearchParams(url.split('/#/people?')[1]);
  params.set('organizationNumEmployeesRanges[]', `${range[0]}%2C${range[1]}`)
  return decodeURI(`${url.split('?')[0]}?${params.toString()}`)
}

export const setPageInApolloURL = (url: string, page?: number) => {
  const params = new URLSearchParams(url.split('/#/people?')[1]);
  params.set('page', page?.toString() || '1')
  return decodeURI(`${url.split('?')[0]}?${params.toString()}`)
}

export const getPageInApolloURL = (url: string) => {
  const params = new URLSearchParams(url.split('/#/people?')[1]);
  const page = params.get('page')
  return page ? parseInt(page) : 1
}

// if (max - min <= 4) only use 2 scrapers, (max - min >= 5) use 3 or more
export const chuckRange = (min: number, max: number, parts: number): [number, number][] => {
   //@ts-ignore
  var result: [number, number][] = [[]],
      delta = Math.round((max - min) / (parts - 1));
      
  while (min < max) {
      const l = result.length-1
      if (result.length === 1 && result[l].length < 2) {
        //@ts-ignore
        result[l].push(min)
      } else {
        //@ts-ignore
        result.push([result[l][1]+1, min])
      }
      min += delta;
  }
  
  //@ts-ignore
  const l = result[result.length-1][1]+1
  //@ts-ignore
  result.push([l, (l===max)?max+1:max]) 
  return result;
}

export const delay = (time: number) => {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

export class AppError extends Error {
  constructor(protected taskID: string, message: string) {
    super(message);
    this.name = "AppError";
    this.taskID = taskID
  }
}




// const chuckRange = (min, max, parts) => {
//   var result= [[]],
//       delta = Math.round((max - min) / parts);
      
//   while (min < max) {
//       const l = result.length-1
//       if (result.length === 1 && result[l].length < 2) {
//         //@ts-ignore
//         result[l].push(min)
//       } else {
//         //@ts-ignore
//         const s = result[l]
//         const val = s[1]?s[1]+1:s[0]+1
//         result.push([val, min])
//       }
//       min += delta;
//   }
  
//   //@ts-ignore
//   const l = result[result.length-1]
//   const s = l[1]?l[1]+1:l[0]+1
  
//   //@ts-ignore
//   if (s[l].length === 1) s[l].push(l[0]+1)
//   result.push([s, (s===max)?max+1:max]);
//   return result;
// }

// console.log(chuckRange(1,3,2))


// ======== latest =========
// const chuckRange = (min, max, parts) => {
//   var result= [[]],
//       delta = Math.round((max - min) / parts);
      
//   while (min < max) {
//       const l = result.length-1
//       if (result.length === 1 && result[l].length < 2) {
//         //@ts-ignore
//         result[l].push(min)
//       } else {
//         //@ts-ignore
//         const s = result[l]
//         const val = s[1]?s[1]+1:s[0]+1
//         result.push([val, min])
//       }
//       min += delta;
//   }
  
//   //@ts-ignore
//   const l = result[result.length-1]
//   const s = l[1]?l[1]+1:l[0]+1
  
//   //@ts-ignore
//   if (l.length === 1) l.push(l[0]+1)
//   result.push([s, (s===max)?max+1:max]);
//   return result;
// }