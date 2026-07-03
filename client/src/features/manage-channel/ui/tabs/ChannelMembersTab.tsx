import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { UserAvatar } from '@/entities/user';
import {
  CHANNEL_MEMBER_ROLE,
  type ChannelMember,
} from '@/entities/channel';
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
      (m) =>
        m.username.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
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
            className="h-8 text-xs gap-1.5 font-medium border-border hover:bg-accent/40"
          >
            <UserPlus className="h-3.5 w-3.5 text-primary" />
            Add people
          </Button>
        </div>
      )}

      {/* Search Filter */}
      {members.length > 5 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Find a member..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-background border-border"
          />
        </div>
      )}

      {/* Members List */}
      <div className="space-y-1 divide-y divide-border/40 rounded-lg border border-border bg-card p-1">
        {isLoading ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
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
                className="group flex items-center justify-between gap-3 p-2 rounded-md hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
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
                        <span className="text-[10px] text-muted-foreground font-medium">
                          (You)
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {member.role === CHANNEL_MEMBER_ROLE.OWNER ? (
                    <Badge
                      variant="secondary"
                      className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px] gap-1 px-1.5 py-0.5 font-semibold"
                    >
                      <Crown className="h-3 w-3" />
                      Owner
                    </Badge>
                  ) : member.role === CHANNEL_MEMBER_ROLE.ADMIN ? (
                    <Badge
                      variant="secondary"
                      className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 text-[10px] gap-1 px-1.5 py-0.5 font-semibold"
                    >
                      <Shield className="h-3 w-3" />
                      Admin
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-muted-foreground px-1 font-medium">
                      Member
                    </span>
                  )}

                  {canRemove && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveMemberClick(member)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
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
