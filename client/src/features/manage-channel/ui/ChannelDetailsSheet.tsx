import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Badge } from '@/shared/ui/badge';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  useChannelDetailQuery,
  useChannelMembersQuery,
  useRemoveChannelMemberMutation,
  useLeaveChannelMutation,
  useDeleteChannelMutation,
  ChannelAvatar,
  CHANNEL_TYPE,
  CHANNEL_MEMBER_ROLE,
  type ChannelMember,
} from '@/entities/channel';
import { useAppSelector } from '@/app/store';
import { selectCurrentUser } from '@/entities/user';
import { AddMemberModal } from './AddMemberModal';
import { EditChannelModal } from './EditChannelModal';
import { ChannelMembersTab } from './tabs/ChannelMembersTab';
import { ChannelAboutTab } from './tabs/ChannelAboutTab';
import { ChannelSettingsTab } from './tabs/ChannelSettingsTab';
import { Users, Settings, Info } from 'lucide-react';

export interface ChannelDetailsSheetProps {
  channelId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChannelDetailsSheet: React.FC<ChannelDetailsSheetProps> = ({
  channelId = '',
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);

  const [activeTab, setActiveTab] = React.useState<'about' | 'members' | 'settings'>('members');
  const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false);
  const [isEditChannelOpen, setIsEditChannelOpen] = React.useState(false);

  const [confirmAction, setConfirmAction] = React.useState<
    | { type: 'remove-member'; member: ChannelMember }
    | { type: 'leave-channel' }
    | { type: 'delete-channel' }
    | null
  >(null);

  const { data: channel } = useChannelDetailQuery(channelId);
  const { data: members = [], isLoading: isLoadingMembers } = useChannelMembersQuery(
    channelId,
    open
  );

  const isDirect = channel?.type === CHANNEL_TYPE.DIRECT;

  // Resolve current user's role in this channel
  const myMembership = React.useMemo(() => {
    return members.find((m) => m.userId === currentUser?.id);
  }, [members, currentUser]);

  const isOwner = myMembership?.role === CHANNEL_MEMBER_ROLE.OWNER;
  const isAdmin = myMembership?.role === CHANNEL_MEMBER_ROLE.ADMIN;
  const isManager = isOwner || isAdmin;

  // Mutations
  const removeMemberMutation = useRemoveChannelMemberMutation(channelId, {
    onSuccess: () => setConfirmAction(null),
  });

  const leaveChannelMutation = useLeaveChannelMutation(channelId, {
    onSuccess: () => {
      setConfirmAction(null);
      onOpenChange(false);
      navigate('/chat');
    },
  });

  const deleteChannelMutation = useDeleteChannelMutation(channelId, {
    onSuccess: () => {
      setConfirmAction(null);
      onOpenChange(false);
      navigate('/chat');
    },
  });

  const executeConfirmedAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'remove-member') {
      removeMemberMutation.mutate(confirmAction.member.userId);
    } else if (confirmAction.type === 'leave-channel') {
      leaveChannelMutation.mutate();
    } else if (confirmAction.type === 'delete-channel') {
      deleteChannelMutation.mutate();
    }
  };

  const isPendingConfirmation =
    removeMemberMutation.isPending ||
    leaveChannelMutation.isPending ||
    deleteChannelMutation.isPending;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col bg-background p-0 sm:max-w-md">
          {/* Header section (Slack Jade Style) */}
          <SheetHeader className="border-b border-border bg-card/60 p-5 text-left">
            <div className="flex items-center gap-3">
              <ChannelAvatar
                channel={channel}
                size="md"
                className="shrink-0 rounded-xl shadow-xs"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <SheetTitle className="truncate text-base font-bold text-foreground">
                    {channel?.name || 'Channel Details'}
                  </SheetTitle>
                  <Badge
                    variant={isDirect ? 'outline' : 'secondary'}
                    className="shrink-0 text-[10px] font-medium"
                  >
                    {isDirect ? 'Direct Message' : 'Group'}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">
                  {isDirect ? '1-on-1 private conversation' : `${members.length} members`}
                </p>
              </div>
            </div>

            {/* Slack Style Navigation Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as typeof activeTab)}
              className="mt-4 w-full"
            >
              <TabsList className="grid h-8 w-full grid-cols-3 bg-muted/60 p-0.5">
                <TabsTrigger
                  value="members"
                  className="py-1 text-xs font-medium data-[state=active]:bg-background"
                >
                  <Users className="mr-1.5 h-3.5 w-3.5" />
                  Members
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="py-1 text-xs font-medium data-[state=active]:bg-background"
                >
                  <Info className="mr-1.5 h-3.5 w-3.5" />
                  About
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  disabled={isDirect}
                  className="py-1 text-xs font-medium disabled:opacity-40 data-[state=active]:bg-background"
                >
                  <Settings className="mr-1.5 h-3.5 w-3.5" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </SheetHeader>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'members' && (
              <ChannelMembersTab
                members={members}
                isLoading={isLoadingMembers}
                isDirect={Boolean(isDirect)}
                currentUserId={currentUser?.id}
                isManager={isManager}
                isAdmin={isAdmin}
                onAddMemberClick={() => setIsAddMemberOpen(true)}
                onRemoveMemberClick={(member) =>
                  setConfirmAction({ type: 'remove-member', member })
                }
              />
            )}

            {activeTab === 'about' && (
              <ChannelAboutTab
                channel={channel}
                memberCount={members.length}
                isDirect={Boolean(isDirect)}
                isManager={isManager}
                onEditClick={() => setIsEditChannelOpen(true)}
              />
            )}

            {activeTab === 'settings' && !isDirect && (
              <ChannelSettingsTab
                isOwner={isOwner}
                onLeaveClick={() => setConfirmAction({ type: 'leave-channel' })}
                onDeleteClick={() => setConfirmAction({ type: 'delete-channel' })}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AddMemberModal
        channelId={channelId}
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
      />

      <EditChannelModal
        channelId={channelId}
        open={isEditChannelOpen}
        onOpenChange={setIsEditChannelOpen}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onOpenChange={(openVal) => !openVal && setConfirmAction(null)}
        variant="destructive"
        isPending={isPendingConfirmation}
        title={
          confirmAction?.type === 'remove-member'
            ? 'Remove Member?'
            : confirmAction?.type === 'leave-channel'
              ? 'Leave Channel?'
              : 'Delete Channel?'
        }
        description={
          confirmAction?.type === 'remove-member' ? (
            <>
              Are you sure you want to remove{' '}
              <strong className="text-foreground">{confirmAction.member.username}</strong> from{' '}
              <strong className="text-foreground">{channel?.name}</strong>? They can be re-invited
              later.
            </>
          ) : confirmAction?.type === 'leave-channel' ? (
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
        confirmText={
          confirmAction?.type === 'remove-member'
            ? 'Remove Member'
            : confirmAction?.type === 'leave-channel'
              ? 'Leave Channel'
              : 'Delete Channel'
        }
        onConfirm={executeConfirmedAction}
      />
    </>
  );
};
