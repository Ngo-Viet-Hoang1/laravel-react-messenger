import * as React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { WorkspaceHeader } from '@/widgets/workspace-header';
import { WorkspaceSidebar } from '@/widgets/workspace-sidebar';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet';
import { useModalStore } from '@/shared/model/useModalStore';
import { CreateChannelModal } from '@/features/create-channel';
import { StartDirectChatModal } from '@/features/start-direct-chat';
import { channelKeys, type ChannelSummary, useMarkAsReadMutation } from '@/entities/channel';
import { messageKeys, MESSAGE_STATUS, type ChatMessage } from '@/entities/message';
import { usePresenceStore } from '@/entities/user';
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

  useSignalREvent('ReceiveMessage', (receivedMsg: SignalRMessageDto) => {

    queryClient.setQueryData<ChannelSummary[]>(channelKeys.lists(), (old = []) =>
      old.map((ch) => {
        if (ch.id !== receivedMsg.channelId) return ch;
        const isCurrentActive = ch.id === activeChannelId;
        const currentUnread = Number(ch.unreadCount ?? 0);
        return {
          ...ch,
          lastActivityAt: receivedMsg.createdAt,
          hasUnread: !isCurrentActive,
          unreadCount: isCurrentActive ? 0 : currentUnread + 1,
        };
      })
    );

    queryClient.setQueryData<ChatMessage[]>(
      messageKeys.byChannel(receivedMsg.channelId),
      (old = []) => {
        const existingIndex = old.findIndex(
          (m) =>
            (receivedMsg.clientMessageId && m.clientMessageId === receivedMsg.clientMessageId) ||
            m.id === receivedMsg.id
        );

        const confirmed: ChatMessage = { ...receivedMsg, status: MESSAGE_STATUS.SENT };
        if (existingIndex !== -1) {
          const updated = [...old];
          updated[existingIndex] = confirmed;
          return updated;
        }

        return [...old, confirmed];
      }
    );
  });

  const { mutate: markChannelAsRead } = useMarkAsReadMutation();

  React.useEffect(() => {
    if (activeChannelId) {
      markChannelAsRead(activeChannelId);
    }
    setMobileSidebarOpen(false);
  }, [activeChannelId, markChannelAsRead]);

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
    </div>
  );
};
