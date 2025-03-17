export interface UserData {
  name?: string;
  email?: string;
  image?: string;
  id?: string;
  magazines?: Record<string, Record<string, unknown>>;
  settings?: {
    theme?: string;
    language?: string;
    notifications?: boolean;
  };
  [key: string]: unknown;
} 