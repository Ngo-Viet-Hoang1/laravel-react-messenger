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
import { GoogleAuthButton } from './GoogleAuthButton';
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
    <Card
      className={cn('w-full max-w-md rounded-xl border-border bg-card p-2 shadow-xs', className)}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-3.5 pt-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Work Email
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
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
                  <FormLabel className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Username
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
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
                  <FormLabel className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
                  <FormLabel className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
              className="h-11 w-full gap-2 rounded-lg font-bold shadow-xs transition-colors"
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

            <div className="relative my-1 w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 font-semibold text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <GoogleAuthButton onSuccess={onSuccess} className="w-full" />

            <p className="pt-1 text-center text-xs text-muted-foreground">
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
