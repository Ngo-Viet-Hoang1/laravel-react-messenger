import * as React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { WorkspaceHeader } from '@/widgets/workspace-header';
import { WorkspaceSidebar } from '@/widgets/workspace-sidebar';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet';
import { useModalStore } from '@/shared/model/useModalStore';
import { CreateChannelModal } from '@/features/create-channel';
import { StartDirectChatModal } from '@/features/start-direct-chat';
import { ChannelDetailsSheet } from '@/features/manage-channel';
import { toast } from 'sonner';
import { channelKeys, type ChannelSummary } from '@/entities/channel';
import {
  messageKeys,
  MESSAGE_STATUS,
  type ChatMessage,
  type MessagesInfiniteData,
  type MessagesPage,
} from '@/entities/message';
import { useAppSelector } from '@/app/store';
import { selectCurrentUser, usePresenceStore } from '@/entities/user';
import {
  startSignalRConnection,
  stopSignalRConnection,
  useSignalREvent,
  type SignalRMessageDto,
} from '@/shared/lib/signalr';

export const WorkspaceLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const currentUser = useAppSelector(selectCurrentUser);
  const activeChannelId = location.pathname.startsWith('/chat/')
    ? location.pathname.replace('/chat/', '')
    : null;

  const modal = useModalStore((state) => state.modal);
  const closeModal = useModalStore((state) => state.closeModal);

  React.useEffect(() => {
    startSignalRConnection().catch((err) => {
      console.warn('[SignalR] Failed to connect on workspace layout mount:', err);
    });

    return () => {
      stopSignalRConnection().catch((err) => {
        console.warn('[SignalR] Failed to stop connection on workspace unmount:', err);
      });
    };
  }, []);

  const setOnlineUsers = usePresenceStore((state) => state.setOnlineUsers);
  const addUser = usePresenceStore((state) => state.addUser);
  const removeUser = usePresenceStore((state) => state.removeUser);

  useSignalREvent('OnlineUsers', (userIds: string[]) => {
    setOnlineUsers(userIds);
  });

  useSignalREvent('UserConnected', (userId: string) => {
    addUser(userId);
  });

  useSignalREvent('UserDisconnected', (userId: string) => {
    removeUser(userId);
  });

  useSignalREvent('ChannelUpdated', (channelId: string) => {
    queryClient.invalidateQueries({ queryKey: channelKeys.detail(channelId) });
    queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
  });

  useSignalREvent('ChannelMembersUpdated', (channelId: string) => {
    queryClient.invalidateQueries({ queryKey: channelKeys.members(channelId) });
    queryClient.invalidateQueries({ queryKey: channelKeys.detail(channelId) });
    queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
  });

  useSignalREvent('ChannelDeleted', (channelId: string) => {
    queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
    queryClient.removeQueries({ queryKey: channelKeys.detail(channelId) });
    queryClient.removeQueries({ queryKey: channelKeys.members(channelId) });

    if (activeChannelId === channelId) {
      toast.info('This channel has been deleted or you were removed.');
      navigate('/chat');
    }
  });

  useSignalREvent('ReceiveMessage', (receivedMsg: SignalRMessageDto) => {
    const isSentByMe = Boolean(currentUser?.id && currentUser.id === receivedMsg.senderId);

    queryClient.setQueryData<ChannelSummary[]>(channelKeys.lists(), (old = []) =>
      old.map((ch) => {
        if (ch.id !== receivedMsg.channelId) return ch;
        const currentUnread = Number(ch.unreadCount ?? 0);
        return {
          ...ch,
          lastActivityAt: receivedMsg.createdAt,
          hasUnread: !isSentByMe,
          unreadCount: isSentByMe ? currentUnread : currentUnread + 1,
        };
      })
    );

    queryClient.setQueryData<MessagesInfiniteData>(
      messageKeys.byChannel(receivedMsg.channelId),
      (old) => {
        const confirmed: ChatMessage = { ...receivedMsg, status: MESSAGE_STATUS.SENT };
        if (!old || old.pages.length === 0) {
          return {
            pages: [{ items: [confirmed], nextCursor: null, hasMore: false }],
            pageParams: [null],
          };
        }

        let replaced = false;
        const updatedPages = old.pages.map((page: MessagesPage) => {
          const existingIndex = page.items.findIndex(
            (m) =>
              (receivedMsg.clientMessageId && m.clientMessageId === receivedMsg.clientMessageId) ||
              m.id === receivedMsg.id
          );

          if (existingIndex !== -1) {
            replaced = true;
            const updatedItems = [...page.items];
            updatedItems[existingIndex] = confirmed;
            return { ...page, items: updatedItems };
          }
          return page;
        });

        if (replaced) {
          return { ...old, pages: updatedPages };
        }

        // New incoming message -> append to the newest page (last page)
        const lastIndex = updatedPages.length - 1;
        updatedPages[lastIndex] = {
          ...updatedPages[lastIndex],
          items: [...updatedPages[lastIndex].items, confirmed],
        };

        return { ...old, pages: updatedPages };
      }
    );
  });

  // Close mobile sidebar sheet drawer on channel change
  React.useEffect(() => {
    setMobileSidebarOpen(false);
  }, [activeChannelId]);

  const handleChannelSuccess = (channel: { id: string }) => {
    closeModal();
    navigate(`/chat/${channel.id}`);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background font-sans text-foreground antialiased">
      <WorkspaceHeader onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
      <div className="relative flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden shrink-0 md:flex">
          <WorkspaceSidebar />
        </div>

        {/* Mobile Sidebar Sheet Drawer */}
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="w-72 max-w-[85vw] border-r-0 bg-sidebar p-0">
            <SheetTitle className="sr-only">Workspace Navigation</SheetTitle>
            <WorkspaceSidebar className="h-full w-full border-r-0" />
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>

      {/* Global Workspace Modals (Mounted once at root level) */}
      <CreateChannelModal
        open={modal?.type === 'create-channel'}
        onOpenChange={(isOpen) => !isOpen && closeModal()}
        onChannelCreated={handleChannelSuccess}
      />
      <StartDirectChatModal
        open={modal?.type === 'direct-chat'}
        onOpenChange={(isOpen) => !isOpen && closeModal()}
        onChatStarted={handleChannelSuccess}
      />
      <ChannelDetailsSheet
        channelId={modal?.type === 'channel-details' ? modal.channelId : undefined}
        open={modal?.type === 'channel-details'}
        onOpenChange={(isOpen) => !isOpen && closeModal()}
      />
    </div>
  );
};
