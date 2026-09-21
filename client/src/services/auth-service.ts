import type { AuthSessionDto, LoginInput, RegisterInput, UserDto } from '@project/shared';
import { AUTH_PATHS } from '../config/api';
import { http } from './http-client';

export async function registerRequest(input: RegisterInput): Promise<UserDto> {
  const res = await http.post<UserDto>(AUTH_PATHS.register, input);
  return res.data;
}

export async function loginRequest(input: LoginInput): Promise<AuthSessionDto> {
  const res = await http.post<AuthSessionDto>(AUTH_PATHS.login, input);
  return res.data;
}

export async function logoutRequest(): Promise<void> {
  await http.post(AUTH_PATHS.logout);
}

export async function fetchMeRequest(): Promise<AuthSessionDto> {
  const res = await http.get<AuthSessionDto>(AUTH_PATHS.me);
  return res.data;
}
