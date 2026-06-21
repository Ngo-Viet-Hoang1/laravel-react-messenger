import * as React from 'react';
import { useParams } from 'react-router-dom';
import { ChatPane } from '@/widgets/chat-pane';
import { MessageSquareDashed, Hash, MessageCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useModalStore } from '@/shared/model/useModalStore';

export const ChatPage: React.FC = () => {
  const { channelId } = useParams<{ channelId?: string }>();
  const openModal = useModalStore((state) => state.openModal);

  if (!channelId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-background px-4 text-center select-none">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/40 bg-muted/60 text-muted-foreground/80">
          <MessageSquareDashed className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Welcome to your Workspace</h2>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Select a channel or direct message from the sidebar to view conversations, or start a new
          one.
        </p>
        <div className="mt-6 flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => openModal({ type: 'create-channel' })}
            className="cursor-pointer gap-1.5 font-semibold"
          >
            <Hash className="h-4 w-4" />
            Create Channel
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openModal({ type: 'direct-chat' })}
            className="cursor-pointer gap-1.5 font-semibold"
          >
            <MessageCircle className="h-4 w-4" />
            New Direct Message
          </Button>
        </div>
      </main>
    );
  }

  return <ChatPane channelId={channelId} />;
};

