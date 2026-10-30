import { api } from '@/shared/api';
import type { components } from '@/shared/api';
import type {
  MessageDto,
  MessagesCursorResponse,
  SendMessagePayload,
  SearchMessagesResponse,
  MessageContextDto,
  CreatePresignedUploadRequest,
  PresignedUploadResultDto,
  CompleteUploadRequest,
  MessageAttachmentDto,
  AttachmentStreamUrlDto,
  StoragePartDetail,
} from '../model/types';

export type ToggleReactionResponse = components['schemas']['ToggleReactionResponse'];

export const messageApi = {
  getMessageContext: async (
    channelId: string,
    messageId: string,
    limit = 40
  ): Promise<MessageContextDto> => {
    return api.get<MessageContextDto>(`/Channels/${channelId}/messages/${messageId}/context`, {
      params: { limit },
    });
  },

  getChannelMessages: async (
    channelId: string,
    before?: string | null,
    limit = 20
  ): Promise<MessagesCursorResponse> => {
    return api.get<MessagesCursorResponse>(`/Channels/${channelId}/messages`, {
      params: { before: before || undefined, limit },
    });
  },

  searchChannelMessages: async (
    channelId: string,
    query: string,
    page = 1,
    pageSize = 20,
    signal?: AbortSignal
  ): Promise<SearchMessagesResponse> => {
    return api.get<SearchMessagesResponse>(`/Channels/${channelId}/messages/search`, {
      params: { query, page, pageSize },
      signal,
    });
  },

  sendMessage: async (channelId: string, payload: SendMessagePayload): Promise<MessageDto> => {
    const { optimisticAttachments: _, ...body } = payload;
    return api.post<MessageDto>(`/Channels/${channelId}/messages`, body);
  },

  toggleReaction: async (messageId: string, emoji: string): Promise<ToggleReactionResponse> => {
    return api.post<ToggleReactionResponse>(`/Messages/${messageId}/reactions`, { emoji });
  },

  createPresignedUpload: async (
    channelId: string,
    payload: CreatePresignedUploadRequest
  ): Promise<PresignedUploadResultDto> => {
    return api.post<PresignedUploadResultDto>(`/Channels/${channelId}/attachments/presign`, payload);
  },

  completeUpload: async (
    channelId: string,
    attachmentId: string,
    payload: CompleteUploadRequest
  ): Promise<MessageAttachmentDto> => {
    return api.post<MessageAttachmentDto>(
      `/Channels/${channelId}/attachments/${attachmentId}/complete`,
      payload
    );
  },

  abortUpload: async (channelId: string, attachmentId: string): Promise<void> => {
    return api.post<void>(`/Channels/${channelId}/attachments/${attachmentId}/abort`, {});
  },

  getAttachmentStreamUrl: async (
    channelId: string,
    attachmentId: string
  ): Promise<AttachmentStreamUrlDto> => {
    return api.get<AttachmentStreamUrlDto>(
      `/Channels/${channelId}/attachments/${attachmentId}/stream-url`
    );
  },

  getUploadedParts: async (
    channelId: string,
    attachmentId: string
  ): Promise<StoragePartDetail[]> => {
    return api.get<StoragePartDetail[]>(
      `/Channels/${channelId}/attachments/${attachmentId}/parts`
    );
  },
};
