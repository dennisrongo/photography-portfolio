export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'photographer' | 'admin';
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: 'photographer' | 'admin';
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  role?: 'photographer' | 'admin';
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}