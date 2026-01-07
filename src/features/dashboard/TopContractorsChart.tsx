import { useMemo } from 'react';
import type { TooltipProps } from 'recharts';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Text, Tooltip, XAxis, YAxis } from 'recharts';
import { useContractors, useCosts } from '../../store/useData';
import { EmptyState } from '../../components/EmptyState';
import { animation, GlassTooltip, gridStyle, neonPalette, tickLabel, toLabel, withAlpha } from './chartTheme';
import { formatEUR } from '../../lib/utils';

export function TopContractorsChart() {
  const costs = useCosts();
  const contractors = useContractors();

  const chartData = useMemo(() => {
    const items = contractors.map((contractor) => ({
      naziv: contractor.naziv ?? contractor.name ?? contractor.ime ?? '',
      bruto: costs.filter((cost) => !cost.is_archived && cost.contractor_id === contractor.id).reduce((acc, cost) => acc + cost.amount_gross, 0),
    }));

    return items
      .map((item) => ({
        label: toLabel(item.naziv || item.ime || item.name || '').trim(),
        bruto: Number(item.bruto ?? item.znesek ?? item.value ?? 0),
      }))
      .filter((d) => d.bruto > 0)
      .sort((a, b) => b.bruto - a.bruto)
      .slice(0, 5);
  }, [contractors, costs]);
  const hasData = chartData.length > 0;

  if (!hasData) {
    return (
      <EmptyState
        title="Ni podatkov – dodaj prvi strošek"
        description="Ko bodo stroški povezani z izvajalci, se bodo prikazali tukaj."
        className="h-64 flex items-center"
      />
    );
  }

  const AxisTick = ({ x, y, payload }: any) => {
    const label = toLabel(payload?.value).trim();
    const truncated = label.length > 20 ? `${label.slice(0, 19)}…` : label;
    // Align text to the start (left) inside the axis area
    return (
      <text x={0} y={y} dy={4} textAnchor="start" className="select-none fill-[rgba(255,255,255,0.7)] text-[12px] font-medium uppercase tracking-wider" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
        <title>{label}</title>
        {truncated}
      </text>
    );
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 6, bottom: 6, left: 0, right: 48 }} barCategoryGap={14}>
          <defs>
            {chartData.map((item, idx) => (
              <linearGradient key={item.label} id={`contractor-${idx}-gradient`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={withAlpha(neonPalette[idx % neonPalette.length], 0.6)} />
                <stop offset="100%" stopColor={withAlpha(neonPalette[(idx + 2) % neonPalette.length], 0.15)} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...gridStyle} strokeWidth={1} horizontal={false} vertical={true} />
          <XAxis type="number" hide />
          <YAxis
            dataKey="label"
            type="category"
            width={170}
            axisLine={false}
            tickLine={false}
            tick={<AxisTick />}
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            content={
              <GlassTooltip<number, string>
                valueFormatter={(value) => formatEUR(value ?? 0)}
                labelFormatter={(label, item: any) => {
                  const payload = Array.isArray(item) ? item[0]?.payload : item?.payload;
                  return toLabel(payload?.label ?? label).trim();
                }}
              />
            }
          />
          <Bar dataKey="bruto" radius={[4, 4, 4, 4]} barSize={32} {...animation}>
            {chartData.map((item, idx) => (
              <Cell
                key={item.label}
                fill={`url(#contractor-${idx}-gradient)`}
                stroke={withAlpha(neonPalette[idx % neonPalette.length], 0.6)}
                strokeWidth={1}
                fillOpacity={1}
                className="transition-all duration-200"
                style={{ filter: `drop-shadow(0 4px 12px ${withAlpha(neonPalette[idx % neonPalette.length], 0.15)})` }}
              />
            ))}
            <LabelList
              dataKey="bruto"
              position="insideRight"
              offset={16}
              content={(props: any) => {
                const { x, y, width, height, value } = props;
                if (!value || value === 0) return null;
                return (
                  <text
                    x={x + width - 12}
                    y={y + height / 2}
                    dy={4}
                    textAnchor="end"
                    fill="rgba(255,255,255,0.95)"
                    style={{
                      fontSize: 11,
                      fontFamily: '"Space Grotesk", sans-serif',
                      fontWeight: 700,
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                      letterSpacing: '0.02em'
                    }}
                  >
                    {formatEUR(value)}
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
