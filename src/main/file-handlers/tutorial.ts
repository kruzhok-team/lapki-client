import { readFile } from 'fs/promises';
import path from 'path';

const basePath = path.join(__dirname, '../../resources').replace('app.asar', 'app.asar.unpacked');

type TutorialItem = { title: string; content: string; showed: boolean };
type TutorialItems = Record<string, TutorialItem>;
export type Tutorial = { items: TutorialItems };

export const getTutorial = async (): Promise<Tutorial> => {
  try {
    const text = await readFile(path.join(basePath + '/tutorial.json'), 'utf-8');
    return JSON.parse(text);
  } catch (error) {
    console.error(error);
    return { items: {} };
  }
};
