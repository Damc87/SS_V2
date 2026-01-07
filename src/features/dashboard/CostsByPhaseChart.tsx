import { useMemo, useState } from 'react';
import type { TooltipProps } from 'recharts';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Text, Tooltip, XAxis, YAxis } from 'recharts';
import { useCosts, usePhases, useSubphases } from '../../store/useData';
import { EmptyState } from '../../components/EmptyState';
import { animation, baseColors, formatCompact, getPhaseColor, GlassTooltip, gridStyle, tickLabel, toLabel, withAlpha } from './chartTheme';
import { formatEUR } from '../../lib/utils';

const pastelGold = '#F4E29C';

export function CostsByPhaseChart() {
  const costs = useCosts();
  const phases = usePhases();
  const subphases = useSubphases();
  const [activePhase, setActivePhase] = useState<string | null>(null);

  const subphaseToMain = useMemo(() => {
    const map = new Map<string, string>();
    Object.values(subphases).forEach((list) => {
      list.forEach((sp) => map.set(sp.id, sp.main_phase_id));
    });
    return map;
  }, [subphases]);

  const data = useMemo(() => {
    const activeCosts = costs.filter((c) => !c.is_archived);
    const items = [...phases]
      .sort((a, b) => a.order_no - b.order_no)
      .map((p) => ({
        fazaId: p.id,
        naziv: p.name ?? (p as any).naziv ?? (p as any).ime ?? '',
        bruto: activeCosts
          .filter((c) => {
            const mainPhaseId = (c.subphase_id && subphaseToMain.get(c.subphase_id)) || c.phase_id;
            return mainPhaseId === p.id;
          })
          .reduce((acc, c) => acc + c.amount_gross, 0),
        color: getPhaseColor(p.id),
      }));

    const sorted = items.map((entry) => ({
      fazaId: entry.fazaId,
      fazaNaziv: toLabel(entry.naziv).trim(),
      znesek: Number(entry.bruto ?? 0),
      color: entry.color,
    }));
    // Sort descending: Largest amount first (on the left)
    return sorted.sort((a, b) => b.znesek - a.znesek);
  }, [costs, phases, subphaseToMain]);
  if (!data.length) {
    return (
      <EmptyState
        title="Ni podatkov – dodaj prvi strošek"
        description="Graf se bo izrisal, ko bodo na voljo stroški."
        className="h-64 flex items-center"
      />
    );
  }

  const truncateLabel = (value: string, max = 14) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

  const AxisTick = ({ x, y, payload }: any) => {
    const raw = payload?.value;
    const labelString = typeof raw === 'string' ? raw : toLabel(raw);
    const label = labelString.replace(/\[object Object\]/g, '').trim().toUpperCase();

    // Word wrapping logic
    const words = label.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      if ((currentLine + ' ' + words[i]).length < 12) {
        currentLine += ' ' + words[i];
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);

    return (
      <text
        x={x}
        y={y}
        dy={14}
        textAnchor="middle"
        className="select-none fill-[rgba(255,255,255,0.75)] text-[12px] font-extrabold uppercase tracking-wider leading-tight"
        style={{ fontFamily: '"Space Grotesk", sans-serif' }}
      >
        <title>{label}</title>
        {lines.map((line, i) => (
          <tspan key={i} x={x} dy={i === 0 ? 0 : 14}>
            {line}
          </tspan>
        ))}
      </text>
    );
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barSize={130}
          barGap={8}
          margin={{ top: 32, bottom: 22, left: 12, right: 12 }}
          onMouseLeave={() => setActivePhase(null)}
        >
          <defs>
            {data.map((entry) => (
              <linearGradient key={entry.fazaId} id={`phase-${entry.fazaId}-gradient`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={withAlpha(pastelGold, 0.1)} />
                <stop offset="100%" stopColor={withAlpha(pastelGold, 0.9)} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...gridStyle} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="fazaNaziv"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={<AxisTick />}
            height={64}
            tickMargin={14}
            padding={{ left: 14, right: 14 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            stroke={baseColors.axis}
            tick={tickLabel}
            tickFormatter={(value: number) => formatCompact(value)}
            width={72}
            domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.05)]}
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            content={
              <GlassTooltip<number, string>
                valueFormatter={(value) => formatEUR(value ?? 0)}
                labelFormatter={(label, item: any) => {
                  const payload = Array.isArray(item) ? item[0]?.payload : item?.payload;
                  return toLabel(payload?.fazaNaziv ?? label).trim();
                }}
              />
            }
          />
          <Bar
            dataKey="znesek"
            radius={[10, 10, 6, 6]}
            {...animation}
          >
            {data.map((entry) => {
              const isMuted = entry.znesek === 0;
              const isActive = activePhase === entry.fazaId && !isMuted;
              return (
                <Cell
                  key={entry.fazaId}
                  fill={`url(#phase-${entry.fazaId}-gradient)`}
                  fillOpacity={isMuted ? 0.2 : 1}
                  className="transition-all duration-200"
                  style={{
                    filter: isMuted
                      ? 'none'
                      : isActive
                        ? `drop-shadow(0 8px 22px ${withAlpha(pastelGold, 0.36)})`
                        : `drop-shadow(0 6px 16px ${withAlpha(pastelGold, 0.22)})`,
                  }}
                  onMouseEnter={() => setActivePhase(entry.fazaId)}
                />
              );
            })}
            <LabelList
              dataKey="znesek"
              position="top"
              content={(props: any) => {
                const { x, y, width, value } = props;
                if (!value || value === 0) return null;
                const label = formatEUR(value);

                return (
                  <text
                    x={x + width / 2}
                    y={y - 12}
                    textAnchor="middle"
                    fill={withAlpha(pastelGold, 0.65)}
                    style={{
                      fontSize: 12,
                      fontFamily: '"Space Grotesk", sans-serif',
                      fontWeight: 700,
                      letterSpacing: '0.01em',
                      textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    {label}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
