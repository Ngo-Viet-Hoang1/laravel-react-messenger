import type { components } from '@/shared/api';

export type AuthResponse = components['schemas']['AuthResponse'];
export type CurrentUserResponse = components['schemas']['CurrentUserResponse'];
export type UserDto = components['schemas']['UserDto'];

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  lastSeenAt?: string | null;
  createdAt?: string;
}
