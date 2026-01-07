import { create } from 'zustand';
import type { Project } from '../types';

export const useProjects = create<{ projects: Project[]; load: () => Promise<void> }>((set) => ({
  projects: [],
  load: async () => {
    const data = await window.api.projects.list();
    set({ projects: data });
  },
}));
