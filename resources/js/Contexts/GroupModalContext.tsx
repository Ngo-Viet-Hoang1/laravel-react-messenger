import { ChatItem } from '@/types';
import { createModalContext } from '@/utils/createModalContext';
import { lazy } from 'react';

const LazyGroupModal = lazy(
    () => import('@/Components/App/CreateOrEditGroupModal'),
);

export const { Provider: GroupModalProvider, useModal: useGroupModal } =
    createModalContext<ChatItem>('Group', LazyGroupModal);
