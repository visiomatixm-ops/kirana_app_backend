// Shared types used across modules

export type UserRole = 'OWNER' | 'STAFF';

export interface AuthUser {
  userId: string;
  shopId: string | null;
  role: UserRole;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface DateRangeQuery {
  from?: string; // ISO date string
  to?: string;
}
