import * as React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { WorkspaceHeader } from '@/widgets/workspace-header';
import { WorkspaceSidebar } from '@/widgets/workspace-sidebar';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet';
import { useModalStore } from '@/shared/model/useModalStore';
import { CreateChannelModal } from '@/features/create-channel';
import { StartDirectChatModal } from '@/features/start-direct-chat';

export const WorkspaceLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const modal = useModalStore((state) => state.modal);
  const closeModal = useModalStore((state) => state.closeModal);

  React.useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

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

