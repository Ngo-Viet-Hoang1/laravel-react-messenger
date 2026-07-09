import * as React from 'react';
import { Search, Info, Users, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Button } from '@/shared/ui/button';
import { ChannelSearchTab } from '@/features/search-messages';
import { ChannelAboutTab, ChannelMembersTab } from '@/features/manage-channel';

export type SidePanelTab = 'search' | 'about' | 'members';

export interface ChannelSidePanelProps {
  channelId: string;
  activeTab: SidePanelTab;
  onTabChange: (tab: SidePanelTab) => void;
  onClose: () => void;
  onSelectMessage: (messageId: string) => void;
}

export const ChannelSidePanel: React.FC<ChannelSidePanelProps> = ({
  channelId,
  activeTab,
  onTabChange,
  onClose,
  onSelectMessage,
}) => {
  return (
    <div className="flex h-full w-full flex-col bg-card/40 select-none">
      {/* Top Header & Tab Switcher */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 px-3">
        <Tabs
          value={activeTab}
          onValueChange={(val) => onTabChange(val as SidePanelTab)}
          className="w-auto"
        >
          <TabsList className="h-8 bg-muted/60 p-0.5">
            <TabsTrigger
              value="search"
              className="cursor-pointer gap-1 px-2.5 py-1 text-xs data-[state=active]:bg-background"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="cursor-pointer gap-1 px-2.5 py-1 text-xs data-[state=active]:bg-background"
            >
              <Info className="h-3.5 w-3.5" />
              <span>About</span>
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="cursor-pointer gap-1 px-2.5 py-1 text-xs data-[state=active]:bg-background"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Members</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
          title="Close panel"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close panel</span>
        </Button>
      </div>

      {activeTab === 'search' && (
        <ChannelSearchTab channelId={channelId} onSelectMessage={onSelectMessage} />
      )}

      {activeTab === 'about' && (
        <div className="flex-1 overflow-y-auto p-4">
          <ChannelAboutTab channelId={channelId} onCloseSheet={onClose} />
        </div>
      )}

      {activeTab === 'members' && (
        <div className="flex-1 overflow-y-auto p-4">
          <ChannelMembersTab channelId={channelId} />
        </div>
      )}
    </div>
  );
};
