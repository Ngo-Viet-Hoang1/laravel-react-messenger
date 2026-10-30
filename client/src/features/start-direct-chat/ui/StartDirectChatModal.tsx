import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog';
import { UserSelector, type UserDto } from '@/entities/user';
import { useStartDirectChatMutation, type ChannelDetail } from '@/entities/channel';
import { MessageSquarePlus } from 'lucide-react';

export interface StartDirectChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatStarted?: (channel: ChannelDetail) => void;
}

export const StartDirectChatModal: React.FC<StartDirectChatModalProps> = ({
  open,
  onOpenChange,
  onChatStarted,
}) => {
  const mutation = useStartDirectChatMutation({
    onSuccess: (channel) => {
      onOpenChange(false);
      onChatStarted?.(channel);
    },
  });

  const handleSelectUser = (user: UserDto) => {
    mutation.mutate(user.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquarePlus className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                New Direct Message
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                Find colleagues by username or email to start a private conversation.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="pt-2">
          <UserSelector
            multiSelect={false}
            onSelectUser={handleSelectUser}
            placeholder="Type a username or email..."
            maxHeight="max-h-72"
            autoFocus
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
