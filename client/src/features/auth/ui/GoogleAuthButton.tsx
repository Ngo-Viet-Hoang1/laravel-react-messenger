import * as React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useGoogleLoginMutation } from '../model/useAuthMutations';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  className?: string;
  text?: string;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  className,
  text = 'Google',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/chat';

  const googleMutation = useGoogleLoginMutation({
    onSuccess: () => {
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(from, { replace: true });
      }
    },
  });

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      if (tokenResponse.access_token) {
        googleMutation.mutate(tokenResponse.access_token);
      }
    },
    onError: (errorResponse) => {
      console.error('Google Sign In Error:', errorResponse);
      toast.error('Google Sign In was cancelled or encountered an error.');
    },
  });

  const isLoading = googleMutation.isPending;

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        disabled={isLoading}
        onClick={() => login()}
        className={cn(
          'relative flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-lg border-border font-medium shadow-2xs transition-all hover:bg-accent/60',
          className
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">
              Connecting to Google...
            </span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-sm font-semibold text-foreground">{text}</span>
          </>
        )}
      </Button>
    </div>
  );
};
