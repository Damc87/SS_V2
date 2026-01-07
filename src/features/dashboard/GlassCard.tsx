import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/ui/card';
import { cn } from '../../lib/utils';
import { baseColors } from './chartTheme';

type GlassCardProps = ComponentPropsWithoutRef<typeof Card> & {
  delay?: number;
  children: ReactNode;
};

export function GlassCard({ className, delay = 0.12, children, ...props }: GlassCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay }}>
      <Card
        className={cn(
          'relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(17,24,39,0.55)] shadow-[0_26px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl',
          className
        )}
        style={{ backgroundColor: baseColors.card }}
        {...props}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[rgba(122,162,255,0.10)] via-transparent to-[rgba(159,122,234,0.06)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.35)]"
          aria-hidden
        />
        <div className="relative">{children}</div>
      </Card>
    </motion.div>
  );
}
