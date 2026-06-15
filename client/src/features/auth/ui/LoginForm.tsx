import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { PasswordInput } from '@/shared/ui/password-input';
import { Card, CardContent, CardFooter } from '@/shared/ui/card';
import { useLoginMutation } from '../model/useAuthMutations';
import { loginSchema, type LoginFormData } from '../model/loginSchema';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface LoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/chat';

  const loginMutation = useLoginMutation({
    onSuccess: () => {
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(from, { replace: true });
      }
    },
  });

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: '',
      password: '',
    },
  });

  const isSubmitting = loginMutation.isPending;

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <Card className={cn('w-full max-w-md border-border shadow-xs rounded-xl bg-card p-2', className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="emailOrUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email or Username
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                      <Input
                        {...field}
                        type="text"
                        autoComplete="username"
                        autoFocus
                        placeholder="name@work-email.com"
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
                      autoComplete="current-password"
                      placeholder="Enter your password"
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
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              New to MessengerApp?{' '}
              <Link
                to="/register"
                className="font-bold text-primary hover:underline focus:outline-none"
              >
                Create an account
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
