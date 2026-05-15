import Dexie, { Table } from 'dexie';

export interface Work {
  id?: number;
  title: string;
  cover: string;
  genres: string;
  totalWords: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id?: number;
  workId: number;
  title: string;
  content: string;
  wordCount: number;
  chapterNumber: number;
  volumeId?: number;
  sortOrder: number;
  isDeleted: number;
  createdAt: string;
  updatedAt: string;
}

export interface Volume {
  id?: number;
  workId: number;
  title: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id?: number;
  workId: number;
  name: string;
  avatar: string;
  gender: string;
  age: number;
  identity: string;
  faction: string;
  personality: string;
  role: string;
  ability: string;
  appearance: string;
  background: string;
  motivation: string;
  arc: string;
  debutChapter: string;
  status: string;
}

export interface WorldNode {
  id?: number;
  workId: number;
  parentId?: number;
  name: string;
  category: string;
  status: string;
}

export interface AiConfig {
  id?: number;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  isDefault: number;
  createdAt: string;
}

class NovelDB extends Dexie {
  works!: Table<Work, number>;
  chapters!: Table<Chapter, number>;
  volumes!: Table<Volume, number>;
  characters!: Table<Character, number>;
  worldNodes!: Table<WorldNode, number>;
  aiConfigs!: Table<AiConfig, number>;

  constructor() {
    super('novelwriter');
    this.version(1).stores({
      works: '++id, title, updatedAt',
      chapters: '++id, workId, chapterNumber, volumeId',
      volumes: '++id, workId, sortOrder',
      characters: '++id, workId',
      worldNodes: '++id, workId, parentId',
      aiConfigs: '++id, isDefault',
    });
  }
}

export const db = new NovelDB();
