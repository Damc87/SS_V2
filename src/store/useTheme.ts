import { create } from 'zustand';

type ThemeMode = 'light' | 'dark' | 'system';
type ThemeState = {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  initialize: () => void;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = 'gradnja-theme';

const getPreferredMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
};

const resolveMode = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
};

const applyTheme = (theme: 'light' | 'dark') => {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'dark');
};

let mediaListenerAttached = false;
let mediaRef: MediaQueryList | null = null;

export const useTheme = create<ThemeState>((set, get) => ({
  mode: 'system',
  resolved: 'light',
  initialize: () => {
    const mode = getPreferredMode();
    const resolved = resolveMode(mode);
    applyTheme(resolved);
    set({ mode, resolved });

    if (!mediaListenerAttached) {
      mediaRef = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (event: MediaQueryListEvent) => {
        if (get().mode === 'system') {
          const next = event.matches ? 'dark' : 'light';
          applyTheme(next);
          set({ resolved: next });
        }
      };
      mediaRef.addEventListener('change', handler);
      mediaListenerAttached = true;
    }
  },
  setMode: (mode) => {
    const resolved = resolveMode(mode);
    applyTheme(resolved);
    window.localStorage.setItem(STORAGE_KEY, mode);
    set({ mode, resolved });
  },
}));
