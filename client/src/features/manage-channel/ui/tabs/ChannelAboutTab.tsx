import * as React from 'react';
import { formatFullDate } from '@/shared/lib/formatters';
import type { ChannelDetail } from '@/entities/channel';
import { Calendar, Users, Pencil } from 'lucide-react';

export interface ChannelAboutTabProps {
  channel?: ChannelDetail;
  memberCount: number;
  isDirect: boolean;
  isManager: boolean;
  onEditClick: () => void;
}

export const ChannelAboutTab: React.FC<ChannelAboutTabProps> = ({
  channel,
  memberCount,
  isDirect,
  isManager,
  onEditClick,
}) => {
  return (
    <div className="space-y-4">
      {/* Description Card */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Topic & Description</span>
          {isManager && !isDirect && (
            <button
              type="button"
              onClick={onEditClick}
              className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {channel?.description || 'No description provided for this channel.'}
        </p>
      </div>

      {/* Metadata Card */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <span className="text-xs font-semibold text-foreground block">Channel Details</span>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-foreground" />
              Created Date
            </span>
            <span className="font-medium text-foreground">
              {formatFullDate(channel?.createdAt)}
            </span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-foreground" />
              Total Members
            </span>
            <span className="font-medium text-foreground">{memberCount}</span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span>Channel Type</span>
            <span className="font-medium text-foreground">
              {isDirect ? 'Direct Message (1:1)' : 'Public Group Channel'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
