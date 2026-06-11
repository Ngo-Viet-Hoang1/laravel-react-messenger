import { ChatItem } from '@/types';
import { createModalContext } from '@/utils/createModalContext';
import { lazy } from 'react';

const LazyChannelModal = lazy(
    () => import('@/Components/App/CreateOrEditGroupModal'),
);

export const { Provider: ChannelModalProvider, useModal: useChannelModal } =
    createModalContext<ChatItem>('Group', LazyChannelModal);
