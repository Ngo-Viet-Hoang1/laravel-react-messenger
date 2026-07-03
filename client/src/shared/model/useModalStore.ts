import { create } from 'zustand';

/**
 * Discriminated union of all global modal types in the workspace.
 * Guarantees compile-time type safety with zero magic strings:
 * - Autocomplete on modal type.
 * - Compulsory typed payload if a modal requires parameters in the future.
 */
export type ModalPayload =
  | { type: 'create-channel' }
  | { type: 'direct-chat' }
  | { type: 'channel-details'; channelId: string };

export type ModalType = ModalPayload['type'];

interface ModalState {
  modal: ModalPayload | null;
  openModal: (modal: ModalPayload) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  modal: null,
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
}));
