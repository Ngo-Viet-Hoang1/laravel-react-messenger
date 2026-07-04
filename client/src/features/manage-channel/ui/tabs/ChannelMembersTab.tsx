import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { UserAvatar } from '@/entities/user';
import { CHANNEL_MEMBER_ROLE, type ChannelMember } from '@/entities/channel';
import { UserPlus, Search, UserX, Crown, Shield } from 'lucide-react';

export interface ChannelMembersTabProps {
  members: ChannelMember[];
  isLoading: boolean;
  isDirect: boolean;
  currentUserId?: string;
  isManager: boolean;
  isAdmin: boolean;
  onAddMemberClick: () => void;
  onRemoveMemberClick: (member: ChannelMember) => void;
}

export const ChannelMembersTab: React.FC<ChannelMembersTabProps> = ({
  members,
  isLoading,
  isDirect,
  currentUserId,
  isManager,
  isAdmin,
  onAddMemberClick,
  onRemoveMemberClick,
}) => {
  const [memberSearch, setMemberSearch] = React.useState('');

  const filteredMembers = React.useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) => m.username.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }, [members, memberSearch]);

  const canRemoveMember = (target: ChannelMember): boolean => {
    if (!isManager || target.userId === currentUserId) return false;
    if (target.role === CHANNEL_MEMBER_ROLE.OWNER) return false;
    if (isAdmin && target.role === CHANNEL_MEMBER_ROLE.ADMIN) return false;
    return true;
  };

  return (
    <div className="space-y-4">
      {/* Header Action: Add People */}
      {!isDirect && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-foreground">
            Channel Members ({members.length})
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddMemberClick}
            className="h-8 gap-1.5 border-border text-xs font-medium text-primary hover:bg-accent/40"
          >
            <UserPlus className="h-3.5 w-3.5 text-primary" />
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
            const isSelf = member.userId === currentUserId;
            const canRemove = canRemoveMember(member);

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

                <div className="flex shrink-0 items-center gap-1.5">
                  {member.role === CHANNEL_MEMBER_ROLE.OWNER ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400"
                    >
                      <Crown className="h-3 w-3" />
                      Owner
                    </Badge>
                  ) : member.role === CHANNEL_MEMBER_ROLE.ADMIN ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-400"
                    >
                      <Shield className="h-3 w-3" />
                      Admin
                    </Badge>
                  ) : (
                    <span className="px-1 text-[10px] font-medium text-muted-foreground">
                      Member
                    </span>
                  )}

                  {canRemove && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveMemberClick(member)}
                      className="h-7 w-7 text-muted-foreground opacity-0 transition-colors group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                      title={`Remove ${member.username} from channel`}
                    >
                      <UserX className="h-3.5 w-3.5" />
                      <span className="sr-only">Remove {member.username}</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
