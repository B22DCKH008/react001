import api from './axios';
import type { AuthTokens, User } from '../types/api.types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthTokens>('/auth/login', { email, password }).then((r) => r.data),

  register: (name: string, email: string, password: string) =>
    api.post<User>('/auth/register', { name, email, password }).then((r) => r.data),

  getProfile: () =>
    api.get<User>('/auth/profile').then((r) => r.data),
};
