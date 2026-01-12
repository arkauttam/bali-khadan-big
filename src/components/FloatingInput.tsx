import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, error, className, value, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value !== undefined && value !== '';

    return (
      <div className="relative">
        <input
          ref={ref}
          {...props}
          value={value}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={cn(
            'peer w-full rounded-xl border bg-secondary/50 px-4 pb-2 pt-6 text-sm outline-none transition-all duration-200',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            error ? 'border-destructive' : 'border-border/50',
            className
          )}
        />
        <motion.label
          initial={false}
          animate={{
            y: isFocused || hasValue ? -8 : 0,
            scale: isFocused || hasValue ? 0.85 : 1,
            color: isFocused
              ? 'hsl(var(--primary))'
              : error
              ? 'hsl(var(--destructive))'
              : 'hsl(var(--muted-foreground))',
          }}
          transition={{ duration: 0.2 }}
          className="absolute left-4 top-4 origin-left pointer-events-none text-sm"
        >
          {label}
        </motion.label>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-xs text-destructive"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = 'FloatingInput';
