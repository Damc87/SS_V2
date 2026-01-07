import type { MainPhase } from '../types';

const palette = ['#7dd3fc', '#a78bfa', '#22d3ee', '#f59e0b', '#34d399', '#38bdf8', '#fb7185', '#8b5cf6'];

const hashString = (value: string) => {
  return value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
};

export const getPhaseColor = (id: string, orderNo?: number) => {
  const base = hashString(id) + (orderNo ?? 0);
  return palette[Math.abs(base) % palette.length];
};

export const buildPhaseColorMap = (phases: MainPhase[]) => {
  return phases.reduce<Record<string, string>>((acc, phase) => {
    acc[phase.id] = getPhaseColor(phase.id, phase.order_no);
    return acc;
  }, {});
};

export const withAlpha = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
