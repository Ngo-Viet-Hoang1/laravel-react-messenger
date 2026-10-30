import * as React from 'react';
import { Input } from './input';
import { Button } from './button';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface PasswordInputProps extends React.ComponentProps<typeof Input> {
  leftIcon?: React.ReactNode;
}

export function PasswordInput({ className, leftIcon, ref, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70">
          {leftIcon}
        </span>
      )}
      <Input
        {...props}
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        className={cn(leftIcon && 'pl-9', 'pr-10', className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setShowPassword((prev) => !prev)}
        tabIndex={-1}
        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}
