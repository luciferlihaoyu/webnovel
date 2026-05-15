import Dexie, { Table } from 'dexie';

export interface Work {
  id?: number;
  title: string;
  category: string;
  coverColor: string;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Volume {
  id?: number;
  workId: number;
  title: string;
  sortOrder: number;
}

export interface Chapter {
  id?: number;
  workId: number;
  volumeId: number;
  title: string;
  content: string;
  wordCount: number;
  sortOrder: number;
  updatedAt: Date;
}

export interface Character {
  id?: number;
  workId: number;
  name: string;
  role: string;
  gender: string;
  age: string;
  appearance: string;
  personality: string;
  background: string;
  abilities: string;
  relationships: string;
  notes: string;
  createdAt: Date;
}

export interface WorldNode {
  id?: number;
  workId: number;
  parentId: number | null;
  name: string;
  type: '势力' | '地点' | '功法' | '历史';
  content: string;
  sortOrder: number;
}

export interface Outline {
  id?: number;
  workId: number;
  intro: string;
  content: string;
}

export interface AIConfig {
  id?: number;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  isDefault: boolean;
}

export class NovelDB extends Dexie {
  works!: Table<Work, number>;
  volumes!: Table<Volume, number>;
  chapters!: Table<Chapter, number>;
  characters!: Table<Character, number>;
  worldNodes!: Table<WorldNode, number>;
  outlines!: Table<Outline, number>;
  aiConfigs!: Table<AIConfig, number>;

  constructor() {
    super('NovelWriterDB');
    this.version(1).stores({
      works: '++id, category, updatedAt',
      volumes: '++id, workId',
      chapters: '++id, workId, volumeId',
      characters: '++id, workId',
      worldNodes: '++id, workId, parentId',
      outlines: '++id, workId',
      aiConfigs: '++id',
    });
  }
}

export const db = new NovelDB();

export const CATEGORIES = ['玄幻', '都市', '言情', '科幻', '历史', '悬疑', '武侠', '游戏'];
export const CATEGORY_COLORS: Record<string, string> = {
  '玄幻': 'bg-amber-500',
  '都市': 'bg-blue-500',
  '言情': 'bg-pink-500',
  '科幻': 'bg-cyan-500',
  '历史': 'bg-yellow-700',
  '悬疑': 'bg-purple-500',
  '武侠': 'bg-green-600',
  '游戏': 'bg-orange-500',
};

export const ROLE_TYPES = ['主角', '配角', '反派', '路人', '导师', '恋人', '家人'];
export const ROLE_COLORS: Record<string, string> = {
  '主角': 'bg-yellow-500 text-yellow-100',
  '配角': 'bg-blue-500 text-blue-100',
  '反派': 'bg-red-500 text-red-100',
  '路人': 'bg-gray-500 text-gray-100',
  '导师': 'bg-purple-500 text-purple-100',
  '恋人': 'bg-pink-500 text-pink-100',
  '家人': 'bg-green-500 text-green-100',
};

export const WORLD_TYPES = ['势力', '地点', '功法', '历史'] as const;
export const WORLD_ICONS: Record<string, string> = {
  '势力': '🏰',
  '地点': '📍',
  '功法': '⚔️',
  '历史': '📜',
};
