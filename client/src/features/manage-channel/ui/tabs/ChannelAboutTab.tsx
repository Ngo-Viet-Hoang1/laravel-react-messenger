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
  useStartDirectChatMutation,
  CHANNEL_TYPE,
  CHANNEL_MEMBER_ROLE,
} from '@/entities/channel';
import { useAppSelector } from '@/app/store';
import { selectCurrentUser } from '@/entities/user';
import { EditChannelModal } from '../EditChannelModal';
import { Pencil, LogOut, Trash2, Lock } from 'lucide-react';

export interface ChannelAboutTabProps {
  channelId: string;
  onCloseSheet: () => void;
}

export const ChannelAboutTab: React.FC<ChannelAboutTabProps> = ({ channelId, onCloseSheet }) => {
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

  const startSecretMutation = useStartDirectChatMutation({
    onSuccess: (newChannel) => {
      onCloseSheet();
      navigate(`/chat/${newChannel.id}`);
    },
  });

  const handleStartSecretChat = (targetUserId: string) => {
    startSecretMutation.mutate({
      targetUserId,
      isSecret: true,
    });
  };

  const otherMember = React.useMemo(
    () => members.find((m) => m.userId !== currentUser?.id),
    [members, currentUser]
  );

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
      {/* Encrypted Chat Shortcut for Direct Messages */}
      {isDirect && !channel?.isSecret && otherMember && (
        <Button
          type="button"
          onClick={() => handleStartSecretChat(otherMember.userId)}
          disabled={startSecretMutation.isPending}
          className="w-full cursor-pointer text-xs font-medium"
        >
          <Lock className="h-3 w-3" />
          {startSecretMutation.isPending ? 'Opening...' : 'Start Encrypted Direct Message'}
        </Button>
      )}

      {/* Description & Topic Card */}
      <div className="space-y-2 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Topic & Description</span>
          {isManager && !isDirect && (
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          )}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {channel?.description || 'No description provided for this channel.'}
        </p>
      </div>

      {/* Channel Metadata Card */}
      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <span className="block text-xs font-semibold text-foreground">Channel Details</span>
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
        </div>
      </div>

      {/* Channel Actions */}
      {!isDirect && (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <span className="block text-xs font-semibold text-foreground">Channel Actions</span>

          {/* Owner Protection Rule: Cannot leave if there are other members */}
          {isOwner && memberCount > 1 ? (
            <div className="space-y-1 rounded-md border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
              <span className="block font-semibold text-foreground">Channel Owner Notice</span>
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
                className="h-8 w-full cursor-pointer justify-start border-border text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Leave Channel
              </Button>
            </>
          )}

          {/* Danger Zone: Owner Only */}
          {isOwner && (
            <div className="mt-3 space-y-2 border-t border-border/80 pt-3">
              <span className="block text-xs font-semibold text-destructive">Danger Zone</span>
              <p className="text-xs text-muted-foreground">
                Permanently soft-delete this channel and its messages for all members.
              </p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setConfirmAction('delete')}
                className="h-8 w-full cursor-pointer justify-start text-xs font-medium"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete Channel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Local Modals & Dialogs */}
      <EditChannelModal channelId={channelId} open={isEditOpen} onOpenChange={setIsEditOpen} />

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
