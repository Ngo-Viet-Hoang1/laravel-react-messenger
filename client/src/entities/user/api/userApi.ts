import { api } from '@/shared/api';
import type { PaginatedUsersResponse, SearchUsersParams } from '../model/types';

export const userApi = {
  searchUsers: (params?: SearchUsersParams): Promise<PaginatedUsersResponse> =>
    api.get<PaginatedUsersResponse>('/Users', { params }),
};

