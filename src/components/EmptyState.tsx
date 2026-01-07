import { type ReactNode } from 'react';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed border-border/70 bg-surface/80 shadow-soft', className)}>
      <CardContent className="flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        {icon && <div className="rounded-2xl bg-muted/80 p-3 text-foreground shadow-inner ring-1 ring-border/70">{icon}</div>}
        <div className="text-lg font-semibold text-foreground">{title}</div>
        {description && <p className="text-sm text-muted-foreground max-w-md">{description}</p>}
        {action}
      </CardContent>
    </Card>
  );
}
