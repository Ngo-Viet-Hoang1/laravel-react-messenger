import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { LogOut, Trash2 } from 'lucide-react';

export interface ChannelSettingsTabProps {
  isOwner: boolean;
  onLeaveClick: () => void;
  onDeleteClick: () => void;
}

export const ChannelSettingsTab: React.FC<ChannelSettingsTabProps> = ({
  isOwner,
  onLeaveClick,
  onDeleteClick,
}) => {
  return (
    <div className="space-y-4">
      {/* Channel Actions Card */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <span className="text-xs font-semibold text-foreground block">Membership</span>
        <p className="text-xs text-muted-foreground">
          Leaving the channel will remove you from the member list and hide this conversation from
          your sidebar.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onLeaveClick}
          className="w-full justify-start text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 font-medium border-border"
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Leave Channel
        </Button>
      </div>

      {/* Danger Zone (Owner Only) */}
      {isOwner && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <span className="text-xs font-semibold text-destructive block">Danger Zone</span>
          <p className="text-xs text-muted-foreground">
            Deleting this channel will permanently soft-delete all associated conversations and
            messages for all members.
          </p>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDeleteClick}
            className="w-full justify-start text-xs h-8 font-medium"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete this channel
          </Button>
        </div>
      )}
    </div>
  );
};
