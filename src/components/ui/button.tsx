import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors duration-fast ease-themed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--fg)] text-[var(--bg-page)] hover:bg-[var(--accent)] hover:text-[var(--accent-fg)]',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-elevated/80',
        outline:
          'border border-[var(--border-strong)] bg-transparent text-foreground hover:bg-elevated',
        ghost: 'hover:bg-elevated text-foreground',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 px-3',
        lg: 'h-12 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(
        buttonVariants({ variant, size }),
        'rounded-[calc(var(--radius)*0.5)]',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
