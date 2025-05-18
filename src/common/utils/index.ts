import fs from 'fs';
import path from 'path';
import { logger } from '../logger';

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(() => resolve(true), ms));
}

export function generateRandomNumberByLength(n: number) {
  const min = Math.pow(10, n - 1);
  const max = Math.pow(10, n) - 1;
  return generateRandomNumber(min, max);
}

export function generateRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRandomString(characters: string, length: number) {
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export function getBaseFolder() {
  return process.cwd();
}

export function getAndEnsureTempDataFolder() {
  const folder = path.join(getBaseFolder(), 'tmp-files');
  if (!fs.existsSync(folder)) {
    logger.log('Create foller: ', folder);
    fs.mkdirSync(folder);
  }
  return folder;
}

export function getHostFromUrl(url: string): string {
  const parsedUrl = new URL(url);
  return parsedUrl.host;
}
