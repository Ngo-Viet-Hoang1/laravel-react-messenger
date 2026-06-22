import type { components, paths } from '@/shared/api';

export type AuthResponse = components['schemas']['AuthResponse'];
export type CurrentUserResponse = components['schemas']['CurrentUserResponse'];
export type UserDto = components['schemas']['UserDto'];
export type PaginatedUsersResponse = components['schemas']['PaginatedListOfUserDto'];
export type SearchUsersParams = NonNullable<paths['/api/Users']['get']['parameters']['query']>;

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  lastSeenAt?: string | null;
  createdAt?: string;
}
