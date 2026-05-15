import { create } from 'zustand';
import { db, AiConfig } from '../db/schema';

interface AiState {
  configs: AiConfig[];
  activeConfig: AiConfig | null;
  loaded: boolean;
  loadConfigs: () => Promise<void>;
  addConfig: (config: Omit<AiConfig, 'id' | 'createdAt'>) => Promise<void>;
  updateConfig: (config: AiConfig) => Promise<void>;
  deleteConfig: (id: number) => Promise<void>;
  setActiveConfig: (config: AiConfig) => void;
  callAI: (prompt: string) => Promise<string>;
}

export const useAiStore = create<AiState>((set, get) => ({
  configs: [],
  activeConfig: null,
  loaded: false,

  loadConfigs: async () => {
    const configs = await db.aiConfigs.orderBy('isDefault').reverse().toArray();
    const active = configs.find((c: AiConfig) => c.isDefault === 1) || configs[0] || null;
    set({ configs, activeConfig: active, loaded: true });
  },

  addConfig: async (config) => {
    const id = await db.aiConfigs.add({
      ...config,
      isDefault: config.isDefault ?? 0,
      createdAt: new Date().toISOString(),
    });
    await get().loadConfigs();
  },

  updateConfig: async (config) => {
    if (config.id) {
      await db.aiConfigs.update(config.id, config);
      await get().loadConfigs();
    }
  },

  deleteConfig: async (id) => {
    await db.aiConfigs.delete(id);
    await get().loadConfigs();
  },

  setActiveConfig: (config) => {
    set({ activeConfig: config });
  },

  callAI: async (prompt: string) => {
    const cfg = get().activeConfig;
    if (!cfg) throw new Error('未配置 AI');
    const resp = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`AI 调用失败: ${resp.status} ${err}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  },
}));
