export interface User {
  id: number;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Deadline {
  id: number;
  user_id: number;
  category_id?: number;
  title: string;
  description?: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface DeadlineCreate {
  title: string;
  description?: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  category_id?: number;
}

export interface DeadlineUpdate {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  is_completed?: boolean;
  category_id?: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}
