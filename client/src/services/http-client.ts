import axios, {
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse } from '@project/shared';
import { API_BASE_URL, AUTH_PATHS, CSRF_HEADER } from '../config/api';
import { ApiError } from '../interfaces/api-error';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Set on the retried request so a second 401 is never refreshed again. */
    _retried?: boolean;
    /** Internal csrf/refresh calls never trigger the refresh-on-401 flow. */
    _internal?: boolean;
  }
}

const SAFE_METHODS = new Set(['get', 'head', 'options']);
// A 401 on these means "bad credentials / no session", never "expired access token".
const NO_REFRESH_PATHS: string[] = [
  AUTH_PATHS.login,
  AUTH_PATHS.register,
  AUTH_PATHS.refresh,
  AUTH_PATHS.csrf,
  AUTH_PATHS.logout,
];
const SESSION_CHANGING_PATHS: string[] = [AUTH_PATHS.login, AUTH_PATHS.register, AUTH_PATHS.logout];

export interface HttpClientOptions {
  baseURL?: string;
  adapter?: AxiosAdapter;
  /** Called when the session cannot be recovered (refresh failed). */
  onAuthFailure?: () => void;
}

export interface HttpClient {
  instance: AxiosInstance;
  /** Forget the cached CSRF token (it is bound to the session). */
  resetCsrf: () => void;
}

function isEnvelope(value: unknown): value is ApiResponse<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as { success: unknown }).success === 'boolean'
  );
}

function toApiError(error: AxiosError): ApiError {
  const status = error.response?.status ?? 0;
  const body: unknown = error.response?.data;
  if (isEnvelope(body) && !body.success) return new ApiError(body.message, status, body.errors ?? []);
  return new ApiError(error.response ? 'Request failed' : 'Network error, please try again', status);
}

function pathOf(config: InternalAxiosRequestConfig): string {
  return (config.url ?? '').split('?')[0] ?? '';
}

export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  const instance = axios.create({
    baseURL: options.baseURL ?? API_BASE_URL,
    withCredentials: true,
    headers: { Accept: 'application/json' },
    ...(options.adapter ? { adapter: options.adapter } : {}),
  });

  let csrfToken: string | null = null;
  let csrfInFlight: Promise<string> | null = null;
  let refreshInFlight: Promise<void> | null = null;

  const resetCsrf = (): void => {
    csrfToken = null;
  };

  const fetchCsrf = (): Promise<string> => {
    csrfInFlight ??= instance
      .get<{ csrfToken: string }>(AUTH_PATHS.csrf, { _internal: true })
      .then((res) => {
        csrfToken = res.data.csrfToken;
        return res.data.csrfToken;
      })
      .finally(() => {
        csrfInFlight = null;
      });
    return csrfInFlight;
  };

  // Single-flight: parallel 401s share one refresh so token rotation is never raced (threat T16).
  const refreshSession = (): Promise<void> => {
    refreshInFlight ??= instance
      .post(AUTH_PATHS.refresh, undefined, { _internal: true })
      .then(() => {
        resetCsrf();
      })
      .finally(() => {
        refreshInFlight = null;
      });
    return refreshInFlight;
  };

  instance.interceptors.request.use(async (config) => {
    if (SAFE_METHODS.has((config.method ?? 'get').toLowerCase())) return config;
    const token = csrfToken ?? (await fetchCsrf());
    const headers = AxiosHeaders.from(config.headers);
    headers.set(CSRF_HEADER, token);
    config.headers = headers;
    return config;
  });

  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const body: unknown = response.data;
      if (isEnvelope(body)) {
        if (!body.success) throw new ApiError(body.message, response.status, body.errors ?? []);
        response.data = body.data;
      }
      if (SESSION_CHANGING_PATHS.includes(pathOf(response.config))) resetCsrf();
      return response;
    },
    async (error: unknown) => {
      if (!axios.isAxiosError(error)) throw error;
      const config = error.config;
      const canRefresh =
        config !== undefined &&
        error.response?.status === 401 &&
        !config._retried &&
        !config._internal &&
        !NO_REFRESH_PATHS.includes(pathOf(config));
      if (!canRefresh) throw toApiError(error);
      try {
        await refreshSession();
      } catch {
        resetCsrf();
        options.onAuthFailure?.();
        throw toApiError(error);
      }
      config._retried = true;
      return instance.request(config);
    },
  );

  return { instance, resetCsrf };
}

let authFailureHandler: () => void = () => undefined;

/** Wired once by the store so a dead session clears Redux auth state. */
export function setAuthFailureHandler(handler: () => void): void {
  authFailureHandler = handler;
}

export const httpClient = createHttpClient({ onAuthFailure: () => authFailureHandler() });
export const http: AxiosInstance = httpClient.instance;
