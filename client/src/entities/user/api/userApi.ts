import { api } from '@/shared/api';
import type {
  PaginatedUsersResponse,
  SearchUsersParams,
  UserDto,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../model/types';

export const userApi = {
  searchUsers: (params?: SearchUsersParams): Promise<PaginatedUsersResponse> =>
    api.get<PaginatedUsersResponse>('/Users', { params }),

  updateProfile: (data: UpdateProfileRequest): Promise<UserDto> =>
    api.put<UserDto>('/Users/profile', data),

  changePassword: (data: ChangePasswordRequest): Promise<void> =>
    api.put<void>('/Users/password', data),
};
