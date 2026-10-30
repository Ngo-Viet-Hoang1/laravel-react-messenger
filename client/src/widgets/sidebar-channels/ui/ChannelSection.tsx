import * as React from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { ChannelItem, type ChannelSummary } from '@/entities/channel';

export interface ChannelSectionProps {
  title: string;
  icon: React.ReactNode;
  channels: ChannelSummary[];
  activeChannelId?: string;
  onSelectChannel: (channel: ChannelSummary) => void;
  onAddClick?: () => void;
  emptyText: string;
  defaultCollapsed?: boolean;
}

export const ChannelSection: React.FC<ChannelSectionProps> = ({
  title,
  icon,
  channels,
  activeChannelId,
  onSelectChannel,
  onAddClick,
  emptyText,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <div>
      {/* Section Header with Collapsible Toggle */}
      <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60 select-none">
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="flex items-center gap-1.5 hover:text-sidebar-foreground transition-colors cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3 opacity-60" />
          ) : (
            <ChevronDown className="h-3 w-3 opacity-60" />
          )}
          <span className="flex items-center gap-1">
            {icon}
            {title}
          </span>
          <span className="text-[10px] text-sidebar-foreground/40 font-normal">
            ({channels.length})
          </span>
        </button>

        {onAddClick && (
          <button
            type="button"
            onClick={onAddClick}
            title={`Create new ${title.toLowerCase()}`}
            className="rounded p-0.5 hover:bg-sidebar-accent transition-colors cursor-pointer text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Channel Items List */}
      {!isCollapsed && (
        <div className="space-y-0.5 mt-0.5">
          {channels.length === 0 ? (
            <div className="px-2.5 py-1.5 text-xs text-sidebar-foreground/50 italic">
              {emptyText}
            </div>
          ) : (
            channels.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                isActive={activeChannelId === channel.id}
                onClick={() => onSelectChannel(channel)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
