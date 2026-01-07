import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

const variantStyles = {
  default:
    'bg-foreground text-background shadow-soft hover:-translate-y-[1px] hover:shadow-card active:translate-y-0 focus-visible:ring-offset-0',
  primary:
    'bg-gradient-to-r from-primary to-primary-soft text-primary-foreground shadow-soft hover:-translate-y-[1px] hover:shadow-card active:translate-y-0',
  secondary:
    'border border-border/80 bg-surface text-foreground shadow-soft hover:-translate-y-[1px] hover:border-border hover:shadow-card',
  outline:
    'border border-border/80 bg-transparent text-foreground hover:bg-muted/70 hover:-translate-y-[1px] active:translate-y-0',
  ghost: 'text-muted-foreground hover:bg-muted/70',
};

const sizeStyles = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
  icon: 'h-10 w-10',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
