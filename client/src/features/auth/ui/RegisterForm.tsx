import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { PasswordInput } from '@/shared/ui/password-input';
import { Card, CardContent, CardFooter } from '@/shared/ui/card';
import { useRegisterMutation } from '../model/useAuthMutations';
import { registerSchema, type RegisterFormData } from '../model/registerSchema';
import { Mail, Lock, User as UserIcon, Loader2, UserPlus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface RegisterFormProps {
  onSuccess?: () => void;
  className?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, className }) => {
  const navigate = useNavigate();

  const registerMutation = useRegisterMutation({
    onSuccess: () => {
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/chat', { replace: true });
      }
    },
  });

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const isSubmitting = registerMutation.isPending;

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate({
      email: data.email,
      username: data.username,
      password: data.password,
    });
  };

  return (
    <Card className={cn('w-full max-w-md border-border shadow-xs rounded-xl bg-card p-2', className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-3.5 pt-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Work Email
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                      <Input
                        {...field}
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        disabled={isSubmitting}
                        className="h-11 pl-9"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Username
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                      <Input
                        {...field}
                        type="text"
                        autoComplete="username"
                        placeholder="john_doe"
                        disabled={isSubmitting}
                        className="h-11 pl-9"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Password
                  </FormLabel>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      autoComplete="new-password"
                      placeholder="Create a strong password"
                      disabled={isSubmitting}
                      className="h-11"
                      leftIcon={<Lock className="h-4 w-4" />}
                    />
                  </FormControl>
                  <FormDescription className="text-[11px] text-muted-foreground">
                    At least 8 characters with uppercase, digit, and special symbol.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      autoComplete="new-password"
                      placeholder="Confirm your password"
                      disabled={isSubmitting}
                      className="h-11"
                      leftIcon={<Lock className="h-4 w-4" />}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2 pb-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 gap-2 font-bold rounded-lg shadow-xs transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create account
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-primary hover:underline focus:outline-none"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
