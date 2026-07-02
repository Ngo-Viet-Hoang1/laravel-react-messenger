import { CHANNEL_TYPE, useUserChannelsQuery, type ChannelSummary } from '@/entities/channel';
import { useModalStore } from '@/shared/model/useModalStore';
import { Skeleton } from '@/shared/ui/skeleton';
import { Hash, MessageCircle } from 'lucide-react';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ChannelSection } from './ChannelSection';
import { NewPeopleSection } from './NewPeopleSection';
import { SidebarSearchInput } from './SidebarSearchInput';

export interface SidebarChannelsProps {
  className?: string;
}

type TabFilter = 'all' | 'channels' | 'direct';

export const SidebarChannels: React.FC<SidebarChannelsProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { channelId: activeChannelId } = useParams<{ channelId?: string }>();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<TabFilter>('all');
  const openModal = useModalStore((state) => state.openModal);

  const { data: channels, isLoading, isError } = useUserChannelsQuery();

  const { groupChannels, directChannels } = React.useMemo(() => {
    const groups: ChannelSummary[] = [];
    const directs: ChannelSummary[] = [];
    const q = searchTerm.trim().toLowerCase();

    for (const channel of channels ?? []) {
      if (q && !channel.name.toLowerCase().includes(q)) continue;
      if (channel.type === CHANNEL_TYPE.GROUP) {
        groups.push(channel);
      } else {
        directs.push(channel);
      }
    }

    const sortByActivity = (a: ChannelSummary, b: ChannelSummary) => {
      const timeA = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    };

    groups.sort(sortByActivity);
    directs.sort(sortByActivity);

    return { groupChannels: groups, directChannels: directs };
  }, [channels, searchTerm]);

  const handleSelectChannel = (channel: ChannelSummary) => {
    navigate(`/chat/${channel.id}`);
  };

  const hasSearch = searchTerm.trim().length > 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Quick Filter / Search Bar */}
      <SidebarSearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        onClear={() => setSearchTerm('')}
      />

      {/* Fast Filter Pill Switcher (Visible when not actively searching) */}
      {!hasSearch && !isLoading && (
        <div className="flex items-center gap-1 px-1">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`cursor-pointer rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('channels')}
            className={`cursor-pointer rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              activeTab === 'channels'
                ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            }`}
          >
            Channels ({groupChannels.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            className={`cursor-pointer rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              activeTab === 'direct'
                ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            }`}
          >
            DMs ({directChannels.length})
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-1.5 px-2 py-1">
          <Skeleton className="h-7 w-full rounded-md" />
          <Skeleton className="h-7 w-full rounded-md" />
          <Skeleton className="h-7 w-3/4 rounded-md" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="px-2.5 py-2 text-xs text-destructive">Failed to load channels.</div>
      )}

      {/* Loaded Channel Lists */}
      {!isLoading && !isError && (
        <>
          {(activeTab === 'all' || activeTab === 'channels') && (
            <ChannelSection
              title="Channels"
              icon={<Hash className="h-3 w-3 opacity-70" />}
              channels={groupChannels}
              activeChannelId={activeChannelId}
              onSelectChannel={handleSelectChannel}
              onAddClick={() => openModal({ type: 'create-channel' })}
              emptyText={hasSearch ? 'No channels match' : 'No channels yet'}
            />
          )}

          {(activeTab === 'all' || activeTab === 'direct') && (
            <ChannelSection
              title="Direct Messages"
              icon={<MessageCircle className="h-3 w-3 opacity-70" />}
              channels={directChannels}
              activeChannelId={activeChannelId}
              onSelectChannel={handleSelectChannel}
              onAddClick={() => openModal({ type: 'direct-chat' })}
              emptyText={hasSearch ? 'No direct chats match' : 'No direct chats yet'}
            />
          )}

          {hasSearch && (
            <NewPeopleSection query={searchTerm} onChatStarted={() => setSearchTerm('')} />
          )}
        </>
      )}
    </div>
  );
};
