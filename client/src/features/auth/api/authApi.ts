import { api } from '@/shared/api/baseClient';
import type { AuthResponse, CurrentUserResponse } from '@/entities/user';
import type { components } from '@/shared/api';

export type LoginDto = components['schemas']['LoginCommand'];
export type RegisterDto = components['schemas']['RegisterCommand'];

export const authApi = {
  login: async (dto: LoginDto): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/login', dto);
  },

  register: async (dto: RegisterDto): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/register', dto);
  },

  googleLogin: async (idToken: string): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/google', { idToken });
  },

  refresh: async (): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/refresh', {}, { _skipAuthRefresh: true, silent: true });
  },

  logout: async (): Promise<void> => {
    return api.post<void>('/auth/logout', {}, { _skipAuthRefresh: true, silent: true });
  },

  getCurrentUser: async (): Promise<CurrentUserResponse> => {
    return api.get<CurrentUserResponse>('/auth/me');
  },
};
