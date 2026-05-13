import { User } from '@/types';
import { createModalContext } from '@/utils/createModalContext';
import { lazy } from 'react';

const LazyUserModal = lazy(
    () => import('@/Components/App/CreateOrEditUserModal'),
);

export const { Provider: UserModalProvider, useModal: useUserModal } =
    createModalContext<User>('User', LazyUserModal);
