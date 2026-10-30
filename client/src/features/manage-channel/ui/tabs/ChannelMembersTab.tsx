import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/shared/ui/dropdown-menu';
import { UserAvatar, selectCurrentUser } from '@/entities/user';
import {
  useChannelMembersQuery,
  useChannelDetailQuery,
  useUpdateChannelMemberRoleMutation,
  useTransferChannelOwnershipMutation,
  useRemoveChannelMemberMutation,
  CHANNEL_MEMBER_ROLE,
  CHANNEL_TYPE,
  type ChannelMember,
  type ChannelMemberRole,
} from '@/entities/channel';
import { useAppSelector } from '@/app/store';
import { AddMemberModal } from '../AddMemberModal';
import { UserPlus, Search, MoreVertical, Loader2 } from 'lucide-react';

export interface ChannelMembersTabProps {
  channelId: string;
}

export const ChannelMembersTab: React.FC<ChannelMembersTabProps> = ({ channelId }) => {
  const currentUser = useAppSelector(selectCurrentUser);

  const [memberSearch, setMemberSearch] = React.useState('');
  const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false);
  const [updatingUserId, setUpdatingUserId] = React.useState<string | null>(null);

  const [confirmAction, setConfirmAction] = React.useState<
    | { type: 'remove'; member: ChannelMember }
    | { type: 'transfer'; member: ChannelMember }
    | null
  >(null);

  // Co-located server queries (deduplicated by TanStack Query cache)
  const { data: members = [], isLoading } = useChannelMembersQuery(channelId);
  const { data: channel } = useChannelDetailQuery(channelId);

  const isDirect = channel?.type === CHANNEL_TYPE.DIRECT;

  // Resolve current viewer's role
  const myMembership = React.useMemo(
    () => members.find((m) => m.userId === currentUser?.id),
    [members, currentUser]
  );

  const isOwner = myMembership?.role === CHANNEL_MEMBER_ROLE.OWNER;
  const isAdmin = myMembership?.role === CHANNEL_MEMBER_ROLE.ADMIN;

  // Co-located mutations
  const updateRoleMutation = useUpdateChannelMemberRoleMutation(channelId, {
    onSuccess: () => setUpdatingUserId(null),
    onError: () => setUpdatingUserId(null),
  });

  const transferOwnershipMutation = useTransferChannelOwnershipMutation(channelId, {
    onSuccess: () => setConfirmAction(null),
    onError: () => setConfirmAction(null),
  });

  const removeMemberMutation = useRemoveChannelMemberMutation(channelId, {
    onSuccess: () => setConfirmAction(null),
    onError: () => setConfirmAction(null),
  });

  const filteredMembers = React.useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) => m.username.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }, [members, memberSearch]);

  const canManageMember = (target: ChannelMember): boolean => {
    if (target.userId === currentUser?.id) return false;
    if (target.role === CHANNEL_MEMBER_ROLE.OWNER) return false;
    if (isOwner) return true;
    if (isAdmin && target.role === CHANNEL_MEMBER_ROLE.MEMBER) return true;
    return false;
  };

  const handleRoleChange = (member: ChannelMember, newRole: ChannelMemberRole) => {
    setUpdatingUserId(member.userId);
    updateRoleMutation.mutate({ userId: member.userId, role: newRole });
  };

  const executeConfirmedAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'remove') {
      removeMemberMutation.mutate(confirmAction.member.userId);
    } else if (confirmAction.type === 'transfer') {
      transferOwnershipMutation.mutate(confirmAction.member.userId);
    }
  };

  const isPendingConfirmation =
    removeMemberMutation.isPending || transferOwnershipMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Header Action: Add People */}
      {!isDirect && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-foreground">
            Members ({members.length})
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddMemberOpen(true)}
            className="h-8 gap-1.5 border-border text-xs font-medium text-primary hover:bg-accent/40 cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add people
          </Button>
        </div>
      )}

      {/* Search Filter */}
      {members.length > 5 && (
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Find a member..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="h-8 border-border bg-background pl-8 text-xs"
          />
        </div>
      )}

      {/* Members List */}
      <div className="space-y-1 divide-y divide-border/40 rounded-lg border border-border bg-card p-1">
        {isLoading ? (
          <div className="space-y-3 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-2.5 w-36" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            No members matching &ldquo;{memberSearch}&rdquo;
          </div>
        ) : (
          filteredMembers.map((member) => {
            const isSelf = member.userId === currentUser?.id;
            const hasActions = canManageMember(member);
            const isUpdating = updatingUserId === member.userId;

            return (
              <div
                key={member.userId}
                className="group flex items-center justify-between gap-3 rounded-md p-2 transition-colors hover:bg-muted/40"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <UserAvatar
                    user={{ username: member.username, avatarUrl: member.avatarUrl }}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-semibold text-foreground">
                        {member.username}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] font-medium text-muted-foreground">(You)</span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {/* Clean Role Badges (No icon clutter) */}
                  {member.role === CHANNEL_MEMBER_ROLE.OWNER ? (
                    <Badge
                      variant="secondary"
                      className="border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400"
                    >
                      Owner
                    </Badge>
                  ) : member.role === CHANNEL_MEMBER_ROLE.ADMIN ? (
                    <Badge
                      variant="secondary"
                      className="border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-400"
                    >
                      Admin
                    </Badge>
                  ) : (
                    <span className="px-1 text-[11px] text-muted-foreground">Member</span>
                  )}

                  {/* Actions Dropdown for Authorized Managers */}
                  {hasActions && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={isUpdating}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                          aria-label={`Manage ${member.username}`}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <MoreVertical className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {isOwner && member.role === CHANNEL_MEMBER_ROLE.MEMBER && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleRoleChange(member, CHANNEL_MEMBER_ROLE.ADMIN)
                            }
                            className="text-xs cursor-pointer"
                          >
                            Promote to Admin
                          </DropdownMenuItem>
                        )}

                        {isOwner && member.role === CHANNEL_MEMBER_ROLE.ADMIN && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleRoleChange(member, CHANNEL_MEMBER_ROLE.MEMBER)
                            }
                            className="text-xs cursor-pointer"
                          >
                            Demote to Member
                          </DropdownMenuItem>
                        )}

                        {isOwner && (
                          <DropdownMenuItem
                            onClick={() =>
                              setConfirmAction({ type: 'transfer', member })
                            }
                            className="text-xs text-amber-600 dark:text-amber-400 focus:text-amber-600 cursor-pointer"
                          >
                            Transfer Ownership
                          </DropdownMenuItem>
                        )}

                        {isOwner && <DropdownMenuSeparator />}

                        <DropdownMenuItem
                          onClick={() => setConfirmAction({ type: 'remove', member })}
                          className="text-xs text-destructive focus:text-destructive cursor-pointer"
                        >
                          Remove from channel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Local Modals & Dialogs */}
      <AddMemberModal
        channelId={channelId}
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        variant={confirmAction?.type === 'remove' ? 'destructive' : 'default'}
        isPending={isPendingConfirmation}
        title={
          confirmAction?.type === 'remove'
            ? 'Remove Member?'
            : 'Transfer Channel Ownership?'
        }
        description={
          confirmAction?.type === 'remove' ? (
            <>
              Are you sure you want to remove{' '}
              <strong className="text-foreground">{confirmAction.member.username}</strong> from{' '}
              <strong className="text-foreground">{channel?.name}</strong>? They can be re-invited
              later.
            </>
          ) : (
            <>
              Are you sure you want to transfer ownership of{' '}
              <strong className="text-foreground">{channel?.name}</strong> to{' '}
              <strong className="text-foreground">{confirmAction?.member.username}</strong>? You
              will become an Administrator and they will have full owner privileges.
            </>
          )
        }
        confirmText={
          confirmAction?.type === 'remove' ? 'Remove Member' : 'Transfer Ownership'
        }
        onConfirm={executeConfirmedAction}
      />
    </div>
  );
};
