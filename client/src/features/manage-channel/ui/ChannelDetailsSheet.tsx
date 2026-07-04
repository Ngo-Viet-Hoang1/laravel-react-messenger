import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Badge } from '@/shared/ui/badge';
import {
  useChannelDetailQuery,
  useChannelMembersQuery,
  ChannelAvatar,
  CHANNEL_TYPE,
} from '@/entities/channel';
import { ChannelMembersTab } from './tabs/ChannelMembersTab';
import { ChannelAboutTab } from './tabs/ChannelAboutTab';
import { ArrowLeft } from 'lucide-react';

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
  const [activeTab, setActiveTab] = React.useState<'about' | 'members'>('about');

  const { data: channel } = useChannelDetailQuery(channelId);
  const { data: members = [] } = useChannelMembersQuery(channelId, open);

  const isDirect = channel?.type === CHANNEL_TYPE.DIRECT;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col bg-background p-0 sm:max-w-md">
        {/* Header section */}
        <SheetHeader className="border-b border-border bg-card/60 p-5 text-left">
          {/* Mobile Navigation Back Button */}
          <div className="sm:hidden flex items-center mb-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center gap-1.5 -ml-1 px-2 py-1 rounded-md text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer active:scale-95"
              aria-label="Back to conversation"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to chat</span>
            </button>
          </div>

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

          {/* Consolidated 2-Tab Navigation (Reserved slot for future Files / Media) */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as typeof activeTab)}
            className="mt-4 w-full"
          >
            <TabsList className="grid h-8 w-full grid-cols-2 bg-muted/60 p-0.5">
              <TabsTrigger
                value="about"
                className="py-1 text-xs font-medium data-[state=active]:bg-background cursor-pointer"
              >
                About
              </TabsTrigger>
              <TabsTrigger
                value="members"
                className="py-1 text-xs font-medium data-[state=active]:bg-background cursor-pointer"
              >
                Members ({members.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </SheetHeader>

        {/* Tab Contents: Zero Prop Drilling with Self-Contained Domain Tabs */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'about' && (
            <ChannelAboutTab
              channelId={channelId}
              onCloseSheet={() => onOpenChange(false)}
            />
          )}

          {activeTab === 'members' && (
            <ChannelMembersTab channelId={channelId} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
