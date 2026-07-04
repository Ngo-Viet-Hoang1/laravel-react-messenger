import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatFullDate } from '@/shared/lib/formatters';
import { Button } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  useChannelDetailQuery,
  useChannelMembersQuery,
  useLeaveChannelMutation,
  useDeleteChannelMutation,
  CHANNEL_TYPE,
  CHANNEL_MEMBER_ROLE,
} from '@/entities/channel';
import { useAppSelector } from '@/app/store';
import { selectCurrentUser } from '@/entities/user';
import { EditChannelModal } from '../EditChannelModal';
import { Pencil, LogOut, Trash2 } from 'lucide-react';

export interface ChannelAboutTabProps {
  channelId: string;
  onCloseSheet: () => void;
}

export const ChannelAboutTab: React.FC<ChannelAboutTabProps> = ({
  channelId,
  onCloseSheet,
}) => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);

  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<'leave' | 'delete' | null>(null);

  const { data: channel } = useChannelDetailQuery(channelId);
  const { data: members = [] } = useChannelMembersQuery(channelId);

  const isDirect = channel?.type === CHANNEL_TYPE.DIRECT;
  const myMembership = React.useMemo(
    () => members.find((m) => m.userId === currentUser?.id),
    [members, currentUser]
  );

  const isOwner = myMembership?.role === CHANNEL_MEMBER_ROLE.OWNER;
  const isAdmin = myMembership?.role === CHANNEL_MEMBER_ROLE.ADMIN;
  const isManager = isOwner || isAdmin;

  const leaveMutation = useLeaveChannelMutation(channelId, {
    onSuccess: () => {
      setConfirmAction(null);
      onCloseSheet();
      navigate('/chat');
    },
  });

  const deleteMutation = useDeleteChannelMutation(channelId, {
    onSuccess: () => {
      setConfirmAction(null);
      onCloseSheet();
      navigate('/chat');
    },
  });

  const handleConfirm = () => {
    if (confirmAction === 'leave') {
      leaveMutation.mutate();
    } else if (confirmAction === 'delete') {
      deleteMutation.mutate();
    }
  };

  const isPending = leaveMutation.isPending || deleteMutation.isPending;
  const memberCount = members.length;

  return (
    <div className="space-y-4">
      {/* Description & Topic Card */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Topic & Description</span>
          {isManager && !isDirect && (
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {channel?.description || 'No description provided for this channel.'}
        </p>
      </div>

      {/* Channel Metadata Card */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <span className="text-xs font-semibold text-foreground block">Channel Details</span>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Created Date</span>
            <span className="font-medium text-foreground">
              {formatFullDate(channel?.createdAt)}
            </span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span>Total Members</span>
            <span className="font-medium text-foreground">{memberCount}</span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span>Channel Type</span>
            <span className="font-medium text-foreground">
              {isDirect ? 'Direct Message (1:1)' : 'Public Group Channel'}
            </span>
          </div>
        </div>
      </div>

      {/* Channel Actions (Only for Group Channels) */}
      {!isDirect && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <span className="text-xs font-semibold text-foreground block">Channel Actions</span>

          {/* Owner Protection Rule: Cannot leave if there are other members */}
          {isOwner && memberCount > 1 ? (
            <div className="rounded-md border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground block">Channel Owner Notice</span>
              <p>
                As the channel owner, you cannot leave while other members are present. You can
                transfer ownership to another member in the <strong>Members</strong> tab or delete
                the channel below.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Leaving this channel will remove you from member updates and hide this conversation
                from your sidebar.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction('leave')}
                className="w-full justify-start text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 font-medium border-border cursor-pointer"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Leave Channel
              </Button>
            </>
          )}

          {/* Danger Zone: Owner Only */}
          {isOwner && (
            <div className="pt-3 mt-3 border-t border-border/80 space-y-2">
              <span className="text-xs font-semibold text-destructive block">Danger Zone</span>
              <p className="text-xs text-muted-foreground">
                Permanently soft-delete this channel and its messages for all members.
              </p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setConfirmAction('delete')}
                className="w-full justify-start text-xs h-8 font-medium cursor-pointer"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete Channel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Local Modals & Dialogs */}
      <EditChannelModal
        channelId={channelId}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        variant="destructive"
        isPending={isPending}
        title={confirmAction === 'leave' ? 'Leave Channel?' : 'Delete Channel?'}
        description={
          confirmAction === 'leave' ? (
            <>
              Are you sure you want to leave{' '}
              <strong className="text-foreground">{channel?.name}</strong>? You will no longer
              receive messages from this channel.
            </>
          ) : (
            <>
              Are you sure you want to delete{' '}
              <strong className="text-foreground">{channel?.name}</strong>? This action will
              soft-delete the channel and remove all members.
            </>
          )
        }
        confirmText={confirmAction === 'leave' ? 'Leave Channel' : 'Delete Channel'}
        onConfirm={handleConfirm}
      />
    </div>
  );
};
