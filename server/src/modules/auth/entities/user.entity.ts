export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'photographer' | 'admin';
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

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'photographer' | 'admin';
}