import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

type LoadingScreenProps = {
  message?: string;
  variant?: 'page' | 'overlay';
};

export function LoadingScreen({ message = 'Nalaganje ...', variant = 'page' }: LoadingScreenProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl px-6 py-5 text-center shadow-card"
    >
      <div className="flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="font-medium">{message}</span>
      </div>
    </motion.div>
  );

  if (variant === 'overlay') {
    return (
      <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center bg-gradient-to-br from-background/80 via-surface/70 to-background/80 backdrop-blur">
        {content}
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-background flex items-center justify-center')}>
      {content}
    </div>
  );
}
