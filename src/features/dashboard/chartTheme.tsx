import type { TooltipProps } from 'recharts';
import { formatEUR } from '../../lib/utils';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

type TooltipItem = {
  name?: NameType;
  value?: ValueType;
  payload?: any;
  color?: string;
  dataKey?: string | number;
};

const baseColors = {
  background: '#0B0F1A',
  card: 'rgba(17,24,39,0.55)',
  grid: 'rgba(255,255,255,0.06)',
  axis: 'rgba(255,255,255,0.55)',
};

const neonPalette = ['#8BE9FD', '#A78BFA', '#7CF5D2', '#7EA0FF', '#FFB86C', '#F472B6'];

const hashString = (value: string) => value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

const toLabel = (v: unknown): string => {
  if (v == null) return '';

  if (typeof v === 'string') {
    if (v === '[object Object]') return '';
    return v;
  }

  if (typeof v === 'number' || typeof v === 'boolean') return String(v);

  if (Array.isArray(v)) {
    return v.map(toLabel).join(', ');
  }

  if (typeof v === 'object') {
    // Check for common label properties
    const candidate =
      (v as { naziv?: unknown }).naziv ??
      (v as { ime?: unknown }).ime ??
      (v as { name?: unknown }).name ??
      (v as { label?: unknown }).label ??
      (v as { title?: unknown }).title ??
      (v as { opis?: unknown }).opis ??
      '';

    // If we found a candidate that is itself an object, recurse
    if (typeof candidate === 'object' && candidate !== null) {
      return toLabel(candidate);
    }

    // If we found a primitive candidate, return it
    if (candidate !== null && candidate !== undefined && candidate !== '') {
      return String(candidate);
    }

    return '';
  }

  const s = String(v);
  if (s === '[object Object]') return '';
  return s;
};

const safeText = (s: unknown) => String(s ?? '');

const sanitizeLabel = (value: unknown) => {
  const text = toLabel(value);
  return safeText(text).replace(/\s{2,}/g, ' ').trim();
};

const withAlpha = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getPhaseColor = (phaseId: string) => {
  const base = hashString(phaseId);
  return neonPalette[Math.abs(base) % neonPalette.length];
};

const tickLabel = {
  fontSize: 11,
  fill: 'rgba(255,255,255,0.65)',
  fontWeight: 500,
  fontFamily: '"Space Grotesk", "Inter", system-ui, -apple-system, sans-serif',
  letterSpacing: '0.04em',
};

const gridStyle = {
  stroke: 'rgba(255,255,255,0.08)',
  strokeDasharray: '',
};

const animation = {
  animationDuration: 820,
  animationEasing: 'ease-out' as const,
};

const tooltipStyles = {
  contentStyle: {
    backgroundColor: 'rgba(15,23,42,0.85)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 16,
    boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
    backdropFilter: 'blur(12px)',
    color: '#F8FAFC',
  },
};

type GlassTooltipProps<TValue extends number = number, TName extends string = string> = TooltipProps<TValue, TName> & {
  labelFormatter?: (label?: string | number, item?: TooltipItem) => string;
  valueFormatter?: (value?: TValue, item?: TooltipItem) => string;
};

function GlassTooltip<TValue extends number = number, TName extends string = string>({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
}: GlassTooltipProps<TValue, TName>) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const titleRaw = labelFormatter ? labelFormatter(label, item) : (item?.payload?.name as string) || label;
  const title = safeText(toLabel(titleRaw)).trim();
  const valueText = valueFormatter ? valueFormatter(item?.value as TValue, item) : safeText(toLabel(item?.value ?? '')).trim();

  return (
    <div className="rounded-xl border border-white/10 bg-[rgba(15,23,42,0.85)] px-3.5 py-3 text-xs text-slate-100 shadow-[0_22px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      <div className="text-[11px] font-semibold text-white/80">{title}</div>
      <div className="text-sm font-bold text-white">{valueText}</div>
    </div>
  );
}

export const formatCompact = (value: number) => {
  if (value === 0) return '0 €';
  if (value < 1000) return `${value} €`;
  return `${Math.round(value / 1000)}k €`;
};

export {
  animation,
  baseColors,
  formatEUR,
  getPhaseColor,
  GlassTooltip,
  gridStyle,
  neonPalette,
  tickLabel,
  tooltipStyles,
  withAlpha,
  sanitizeLabel,
  toLabel,
  safeText,
};
