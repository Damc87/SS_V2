import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useActiveProjectId, useCosts } from '../../store/useData';
import { EmptyState } from '../../components/EmptyState';
import { animation, baseColors, GlassTooltip, gridStyle, neonPalette, safeText, tickLabel, toLabel, withAlpha } from './chartTheme';
import { formatEUR } from '../../lib/utils';

export function CumulatedLineChart() {
  const costs = useCosts();
  const activeProjectId = useActiveProjectId();

  const data = useMemo(() => {
    if (!activeProjectId) return [];

    // Group by month
    const monthlyTotals: Record<string, number> = {};
    costs
      .filter((c) => c.project_id === activeProjectId && !c.is_archived)
      .forEach((c) => {
        // Use invoice_date as primary source for month grouping
        const dateStr = c.invoice_date || '';
        if (dateStr.length >= 7) {
          const monthKey = dateStr.slice(0, 7); // YYYY-MM
          monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + c.amount_gross;
        }
      });

    // Sort by month
    const sortedMonths = Object.keys(monthlyTotals).sort();

    // Calculate cumulative
    let runningTotal = 0;
    return sortedMonths.map((month) => {
      runningTotal += monthlyTotals[month];

      const date = new Date(`${month}-01`);
      const monthName = date.toLocaleDateString('sl-SI', { month: 'long' });
      // Capitalize first letter and add YY
      const label = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${date.getFullYear().toString().slice(-2)}`;

      return {
        name: label,
        value: runningTotal, // Cumulative value
        monthly: monthlyTotals[month] // Keep distinct value if needed for tooltip, though usually line shows value
      };
    });
  }, [costs, activeProjectId]);

  // Check if we have any relevant costs for the active project
  const hasData = useMemo(() => {
    return costs.some((c) => c.project_id === activeProjectId && !c.is_archived) && data.length > 0;
  }, [costs, activeProjectId, data.length]);

  if (!hasData) {
    return (
      <EmptyState
        title="Ni podatkov – dodaj prvi strošek"
        description="Ko bodo stroški na voljo, se bo prikazal mesečni pregled."
        className="h-64 flex items-center"
      />
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 14, bottom: 14, left: 6, right: 6 }}>
          <defs>
            <linearGradient id="monthlyArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={withAlpha(neonPalette[2], 0.4)} />
              <stop offset="100%" stopColor={withAlpha(neonPalette[2], 0.05)} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={tickLabel}
            padding={{ left: data.length === 1 ? 48 : 18, right: data.length === 1 ? 48 : 18 }}
            tickMargin={12}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={tickLabel}
            tickFormatter={(value: number) => formatEUR(value)}
            width={82}
          />
          <Tooltip
            cursor={false}
            content={
              <GlassTooltip<number, string>
                valueFormatter={(value) => formatEUR(value ?? 0)}
                labelFormatter={(label) => safeText(toLabel(label)).trim()}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={withAlpha(neonPalette[2], 1)} // Fully opaque stroke
            fill="url(#monthlyArea)"
            fillOpacity={1}
            strokeWidth={4} // Thicker line
            dot={{ r: 4, fill: withAlpha(neonPalette[2], 1), strokeWidth: 2, stroke: '#0B0F1A' }} // Visible dots with dark stroke for contrast
            activeDot={{ r: 6, fill: withAlpha(neonPalette[2], 1), strokeWidth: 0, stroke: '#fff' }}
            {...animation}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
