export interface User {
  id: string;
  email: string;
  fullName?: string;
  isAdmin?: boolean;
  user_metadata?: {
    full_name?: string;
    is_admin?: boolean;
  };
  app_metadata?: {
    provider?: string;
    [key: string]: any;
  };
} 