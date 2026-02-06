import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIProvider = 'anthropic' | 'openai' | 'google';

export interface AIProviderConfig {
  id: AIProvider;
  name: string;
  models: { id: string; name: string }[];
}

export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    ],
  },
  {
    id: 'google',
    name: 'Google AI',
    models: [
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    ],
  },
];

interface SettingsState {
  // API Keys
  anthropicApiKey: string;
  openaiApiKey: string;
  googleApiKey: string;

  // Selected provider and model
  selectedProvider: AIProvider;
  selectedModel: string;

  // Profile
  userName: string;

  // Actions
  setApiKey: (provider: AIProvider, key: string) => void;
  setSelectedProvider: (provider: AIProvider) => void;
  setSelectedModel: (model: string) => void;
  setUserName: (name: string) => void;
  getActiveApiKey: () => string;
  hasValidApiKey: () => boolean;
  clearSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // API Keys
      anthropicApiKey: '',
      openaiApiKey: '',
      googleApiKey: '',

      // Defaults
      selectedProvider: 'anthropic',
      selectedModel: 'claude-sonnet-4-20250514',
      userName: '',

      // Actions
      setApiKey: (provider, key) => {
        switch (provider) {
          case 'anthropic':
            set({ anthropicApiKey: key });
            break;
          case 'openai':
            set({ openaiApiKey: key });
            break;
          case 'google':
            set({ googleApiKey: key });
            break;
        }
      },

      setSelectedProvider: (provider) => {
        const providerConfig = AI_PROVIDERS.find((p) => p.id === provider);
        set({
          selectedProvider: provider,
          selectedModel: providerConfig?.models[0]?.id || '',
        });
      },

      setSelectedModel: (model) => set({ selectedModel: model }),

      setUserName: (name) => set({ userName: name }),

      getActiveApiKey: () => {
        const state = get();
        switch (state.selectedProvider) {
          case 'anthropic':
            return state.anthropicApiKey;
          case 'openai':
            return state.openaiApiKey;
          case 'google':
            return state.googleApiKey;
          default:
            return '';
        }
      },

      hasValidApiKey: () => {
        const key = get().getActiveApiKey();
        return key.length > 10;
      },

      clearSettings: () =>
        set({
          anthropicApiKey: '',
          openaiApiKey: '',
          googleApiKey: '',
          userName: '',
        }),
    }),
    {
      name: 'floorplan-settings',
    }
  )
);
