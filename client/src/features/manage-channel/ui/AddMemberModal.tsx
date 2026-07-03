import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { UserAvatar, UserSelector, type UserDto } from '@/entities/user';
import { useChannelMembersQuery, useAddChannelMembersMutation } from '@/entities/channel';
import { UserPlus, X, Loader2 } from 'lucide-react';

export interface AddMemberModalProps {
  channelId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMembersAdded?: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  channelId = '',
  open,
  onOpenChange,
  onMembersAdded,
}) => {
  const [selectedUsers, setSelectedUsers] = React.useState<Map<string, UserDto>>(new Map());

  const { data: currentMembers = [] } = useChannelMembersQuery(channelId, open);

  const existingMemberIds = React.useMemo(() => {
    return new Set(currentMembers.map((m) => m.userId));
  }, [currentMembers]);

  const addMembersMutation = useAddChannelMembersMutation(channelId, {
    onSuccess: () => {
      setSelectedUsers(new Map());
      onOpenChange(false);
      onMembersAdded?.();
    },
  });

  const handleToggleUser = (user: UserDto) => {
    setSelectedUsers((prev) => {
      const next = new Map(prev);
      if (next.has(user.id)) {
        next.delete(user.id);
      } else {
        next.set(user.id, user);
      }
      return next;
    });
  };

  const handleRemoveChip = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUsers((prev) => {
      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.size === 0 || addMembersMutation.isPending) return;
    addMembersMutation.mutate(Array.from(selectedUsers.keys()));
  };

  const handleClose = () => {
    if (!addMembersMutation.isPending) {
      setSelectedUsers(new Map());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => (!val ? handleClose() : onOpenChange(true))}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <UserPlus className="h-5 w-5" />
            <DialogTitle>Add Members</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Search and select teammates to invite to this channel.
          </DialogDescription>
        </DialogHeader>

        {/* Selected Members Chips */}
        {selectedUsers.size > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-2 max-h-24 overflow-y-auto">
            {Array.from(selectedUsers.values()).map((u) => (
              <Badge
                key={u.id}
                variant="secondary"
                className="flex items-center gap-1.5 py-1 pl-1 pr-1.5 text-xs font-medium bg-background border border-border shadow-2xs"
              >
                <UserAvatar user={{ username: u.username, avatarUrl: u.avatarUrl }} size="xs" />
                <span className="truncate max-w-[120px]">{u.username}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveChip(u.id, e)}
                  className="rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {u.username}</span>
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Reusable UserSelector */}
        <UserSelector
          multiSelect
          selectedUserIds={new Set(selectedUsers.keys())}
          disabledUserIds={existingMemberIds}
          disabledBadgeText="In channel"
          onToggleUser={handleToggleUser}
          autoFocus
        />

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={addMembersMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={selectedUsers.size === 0 || addMembersMutation.isPending}
          >
            {addMembersMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Adding...
              </>
            ) : (
              `Add ${selectedUsers.size > 0 ? `(${selectedUsers.size})` : ''} Members`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
