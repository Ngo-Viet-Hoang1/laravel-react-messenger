import type { components } from '@/shared/api';

export type MessageDto = components['schemas']['MessageDto'];
export type ReactionGroupDto = components['schemas']['ReactionGroupDto'];
export type CursorPagedListOfMessageDto = components['schemas']['CursorPagedListOfMessageDto'];
export type MessagesCursorResponse = CursorPagedListOfMessageDto;
export type SendMessagePayload = components['schemas']['SendMessageRequest'];

export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

export type OptimisticStatus = (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS];

export interface ChatMessage extends MessageDto {
  status?: OptimisticStatus;
}
