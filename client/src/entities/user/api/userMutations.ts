import { useMutation } from '@tanstack/react-query';
import { userApi } from './userApi';
import type { UpdateProfileRequest, ChangePasswordRequest, UserDto } from '../model/types';
import type { MutationCallbacks } from '@/shared/api';
import { useAppDispatch } from '@/app/store';
import { updateUser } from '../model/authSlice';
import { toast } from 'sonner';

export type UseUpdateProfileMutationOptions = MutationCallbacks<UserDto>;

export const useUpdateProfileMutation = (options?: UseUpdateProfileMutationOptions) => {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => userApi.updateProfile(data),
    meta: {
      errorMessage: 'Failed to update profile.',
    },
    onSuccess: (updatedUser) => {
      dispatch(updateUser(updatedUser));
      toast.success('Profile updated successfully!');
      options?.onSuccess?.(updatedUser);
    },
    onError: (error: unknown) => {
      options?.onError?.(error);
    },
  });
};

export type UseChangePasswordMutationOptions = MutationCallbacks;

export const useChangePasswordMutation = (options?: UseChangePasswordMutationOptions) => {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => userApi.changePassword(data),
    meta: {
      errorMessage: 'Failed to change password. Please verify your current password.',
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      options?.onError?.(error);
    },
  });
};
