import type { components } from '@/shared/api';

export type MessageDto = components['schemas']['MessageDto'];
export type MessageAttachmentDto = components['schemas']['MessageAttachmentDto'];
export type PresignedUploadResultDto = components['schemas']['PresignedUploadResultDto'];
export type CreatePresignedUploadRequest = components['schemas']['CreatePresignedUploadRequest'];
export type CompleteUploadRequest = components['schemas']['CompleteUploadRequest'];
export type CompletePartRequest = components['schemas']['CompletePartRequest'];
export type AttachmentStreamUrlDto = components['schemas']['AttachmentStreamUrlDto'];
export type StoragePartDetail = components['schemas']['StoragePartDetail'];
export type ReplyToMessageDto = components['schemas']['ReplyToMessageDto'];
export type ReactionGroupDto = components['schemas']['ReactionGroupDto'];
export type CursorPagedListOfMessageDto = components['schemas']['CursorPagedListOfMessageDto'];
export type MessagesCursorResponse = CursorPagedListOfMessageDto;
export type PaginatedListOfMessageDto = components['schemas']['PaginatedListOfMessageDto'];
export type SearchMessagesResponse = PaginatedListOfMessageDto;
export type MessageContextDto = components['schemas']['MessageContextDto'];
export type SendMessagePayload = components['schemas']['SendMessageRequest'] & {
  optimisticAttachments?: MessageAttachmentDto[];
};

export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

export type OptimisticStatus = (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS];

export interface ChatMessage extends MessageDto {
  status?: OptimisticStatus;
}
