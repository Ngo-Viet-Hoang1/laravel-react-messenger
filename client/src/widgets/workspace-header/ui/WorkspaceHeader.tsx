import * as React from 'react';
import { useAppSelector } from '@/app/store';
import { selectCurrentUser, UserAvatar } from '@/entities/user';
import { useLogoutMutation } from '@/features/auth';
import { ThemeToggle } from '@/shared/theme';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Menu, LogOut } from 'lucide-react';

export interface WorkspaceHeaderProps {
  onOpenMobileSidebar?: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ onOpenMobileSidebar }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const logoutMutation = useLogoutMutation();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-card px-3 select-none sm:px-4">
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {onOpenMobileSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenMobileSidebar}
            className="h-8 w-8 shrink-0 cursor-pointer text-muted-foreground hover:bg-muted md:hidden"
            title="Open navigation"
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle navigation</span>
          </Button>
        )}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-xs">
          #
        </div>
        <span className="truncate text-sm font-bold tracking-tight text-foreground">MessentR</span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle className="h-8 w-8 shrink-0" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative flex aspect-square h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full p-0 transition-all outline-none select-none hover:ring-2 hover:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary"
              title="User profile & settings"
            >
              <UserAvatar user={currentUser} size="sm" showPresence isOnline />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="truncate text-sm leading-none font-semibold text-foreground">
                  {currentUser?.username || 'You'}
                </p>
                <p className="truncate text-xs leading-none text-muted-foreground">
                  {currentUser?.email || 'authenticated'}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
