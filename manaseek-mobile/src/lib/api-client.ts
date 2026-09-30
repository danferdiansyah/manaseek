export type Tokens = { accessToken: string; refreshToken: string };
export interface TokenStore {
  read(): Promise<Tokens | null>;
  write(tokens: Tokens | null): Promise<void>;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}
export const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Terjadi kesalahan. Silakan coba lagi.";
type Options = {
  method?: string;
  body?: unknown;
  public?: boolean;
  timeout?: number;
};

/** One refresh for concurrent 401s; a logout/account switch invalidates all old work. */
export class ApiClient {
  private tokens: Tokens | null = null;
  private refreshFlight: Promise<void> | null = null;
  private writes: Promise<void> = Promise.resolve();
  private version = 0;
  readonly ready: Promise<void>;
  onExpired: () => void = () => {};
  constructor(
    private base: string,
    private store: TokenStore,
    private transport: typeof fetch = fetch,
  ) {
    this.ready = store.read().then((value) => {
      if (this.version === 0) this.tokens = value;
    });
  }
  get sessionVersion() {
    return this.version;
  }
  get session() {
    return this.tokens;
  }
  private persist(tokens: Tokens | null) {
    const task = this.writes
      .catch(() => {})
      .then(() => this.store.write(tokens));
    this.writes = task;
    return task;
  }
  async setSession(tokens: Tokens | null) {
    this.version++;
    this.tokens = tokens;
    this.refreshFlight = null;
    await this.persist(tokens);
  }
  private assertSession(version: number) {
    if (this.version !== version)
      throw new ApiError(409, "SESSION_CHANGED", "Sesi akun telah berubah.");
  }
  private async raw<T>(
    path: string,
    options: Options,
    token?: string,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      options.timeout ?? 25000,
    );
    try {
      // Native/browser fetch must not receive the ApiClient instance as `this`.
      const transport = this.transport;
      const response = await transport(this.base + path, {
        method: options.method ?? "GET",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(options.body !== undefined
            ? { "Content-Type": "application/json" }
            : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body:
          options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });
      const text = await response.text();
      let payload;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        throw new ApiError(
          response.status,
          "INVALID_RESPONSE",
          "Layanan mengembalikan respons yang tidak valid.",
        );
      }
      if (!response.ok)
        throw new ApiError(
          response.status,
          payload?.error?.code ?? "REQUEST_FAILED",
          payload?.error?.message ?? "Permintaan belum berhasil.",
          payload?.error?.details,
        );
      return payload as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        0,
        "NETWORK_ERROR",
        "Koneksi terputus atau layanan tidak merespons. Periksa internet lalu coba lagi.",
      );
    } finally {
      clearTimeout(timer);
    }
  }
  private async refresh(version: number) {
    this.assertSession(version);
    if (!this.tokens)
      throw new ApiError(401, "UNAUTHORIZED", "Masuk untuk melanjutkan.");
    if (!this.refreshFlight) {
      const refreshToken = this.tokens.refreshToken;
      const flight = (async () => {
        try {
          const tokens = await this.raw<Tokens>("/auth/refresh", {
            method: "POST",
            body: { refreshToken },
            public: true,
          });
          this.assertSession(version);
          this.tokens = tokens;
          await this.persist(tokens);
        } catch (error) {
          if (
            this.version === version &&
            error instanceof ApiError &&
            [401, 403].includes(error.status)
          ) {
            await this.setSession(null);
            this.onExpired();
          }
          throw error;
        }
      })();
      this.refreshFlight = flight;
      void flight
        .finally(() => {
          if (this.refreshFlight === flight) this.refreshFlight = null;
        })
        .catch(() => {});
    }
    await this.refreshFlight;
  }
  async request<T>(path: string, options: Options = {}): Promise<T> {
    await this.ready;
    const version = this.version;
    const token = options.public ? undefined : this.tokens?.accessToken;
    if (!options.public && !token)
      throw new ApiError(401, "UNAUTHORIZED", "Masuk untuk membuka fitur ini.");
    try {
      const data = await this.raw<T>(path, options, token);
      this.assertSession(version);
      return data;
    } catch (error) {
      this.assertSession(version);
      if (
        options.public ||
        !(error instanceof ApiError) ||
        error.status !== 401 ||
        !["TOKEN_INVALID", "UNAUTHORIZED"].includes(error.code)
      )
        throw error;
      // A late 401 can arrive after the shared refresh has already finished.
      if (this.tokens?.accessToken === token) await this.refresh(version);
      this.assertSession(version);
      const data = await this.raw<T>(path, options, this.tokens?.accessToken);
      this.assertSession(version);
      return data;
    }
  }
  get<T>(path: string) {
    return this.request<T>(path);
  }
  post<T>(path: string, body?: unknown, options: Options = {}) {
    return this.request<T>(path, { ...options, method: "POST", body });
  }
  patch<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: "PATCH", body });
  }
  put<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: "PUT", body });
  }
  delete<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "DELETE", body });
  }
}
