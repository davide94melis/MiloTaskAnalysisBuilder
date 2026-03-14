import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';

export interface TaskBuilderAuthUser {
  id: string;
  miloUserId?: string | null;
  email: string | null;
}

interface AuthMeResponse {
  id: string;
  miloUserId?: string | null;
  email: string | null;
}

@Injectable({ providedIn: 'root' })
export class MiloAuthService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  private readonly tokenKey = 'milo_task_builder_token';
  private readonly userKey = 'milo_task_builder_user';

  private readonly tokenSignal = signal<string | null>(null);
  private readonly userSignal = signal<TaskBuilderAuthUser | null>(null);
  private readonly hydratedSignal = signal(false);

  readonly currentUser = computed(() => this.userSignal());
  readonly isHydrated = computed(() => this.hydratedSignal());
  readonly isLoggedIn = computed(() => Boolean(this.tokenSignal() && this.userSignal()));

  constructor() {
    this.loadFromStorage();
  }

  getAccessToken(): string | null {
    return this.tokenSignal();
  }

  async restoreSession(): Promise<TaskBuilderAuthUser | null> {
    this.loadFromStorage();

    const token = this.tokenSignal();
    if (!token) {
      this.hydratedSignal.set(true);
      return null;
    }

    try {
      const response = await firstValueFrom(
        this.http.get<AuthMeResponse>(`${this.config.apiUrl}/auth/me`)
      );

      const user: TaskBuilderAuthUser = {
        id: response.id,
        miloUserId: response.miloUserId ?? null,
        email: response.email
      };

      this.persist(token, user);
      return user;
    } catch {
      this.logout();
      return null;
    } finally {
      this.hydratedSignal.set(true);
    }
  }

  acceptTokenHandoff(token: string): void {
    const trimmed = token.trim();
    if (!trimmed) {
      return;
    }

    this.tokenSignal.set(trimmed);
    localStorage.setItem(this.tokenKey, trimmed);
  }

  buildLoginBridgeUrl(options: {
    intent?: string;
    shareToken?: string;
    redirectTo?: string;
  } = {}): string {
    const baseUrl =
      typeof window === 'undefined' ? 'http://localhost/auth/login' : `${window.location.origin}/auth/login`;
    const url = new URL(baseUrl);

    if (options.intent) {
      url.searchParams.set('intent', options.intent);
    }

    if (options.shareToken) {
      url.searchParams.set('shareToken', options.shareToken);
    }

    if (options.redirectTo) {
      url.searchParams.set('redirectTo', options.redirectTo);
    }

    return url.toString();
  }

  beginMiloLogin(returnUrl = window.location.href): void {
    const miloBase = this.config.miloApiBaseUrl.replace(/\/api\/?$/, '');
    const separator = miloBase.includes('?') ? '&' : '?';
    window.location.href = `${miloBase}/login${separator}returnUrl=${encodeURIComponent(returnUrl)}`;
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.hydratedSignal.set(true);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  private loadFromStorage(): void {
    try {
      const token = localStorage.getItem(this.tokenKey);
      const rawUser = localStorage.getItem(this.userKey);
      const user = rawUser ? (JSON.parse(rawUser) as TaskBuilderAuthUser) : null;

      this.tokenSignal.set(token);
      this.userSignal.set(user);
    } catch {
      this.tokenSignal.set(null);
      this.userSignal.set(null);
    }
  }

  private persist(token: string, user: TaskBuilderAuthUser): void {
    this.tokenSignal.set(token);
    this.userSignal.set(user);
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }
}
