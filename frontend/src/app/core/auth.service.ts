import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthResponse, UserSummary } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenKey = 'ti_garantias_token';
  private readonly userKey = 'ti_garantias_user';

  readonly token = signal<string | null>(localStorage.getItem(this.tokenKey));
  readonly user = signal<UserSummary | null>(this.readUser());
  readonly isAuthenticated = computed(() => !!this.token());

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiBaseUrl}/api/auth/login`, { email, password }).pipe(
      tap(response => {
        localStorage.setItem(this.tokenKey, response.accessToken);
        localStorage.setItem(this.userKey, JSON.stringify(response.user));
        this.token.set(response.accessToken);
        this.user.set(response.user);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.token.set(null);
    this.user.set(null);
    void this.router.navigate(['/login']);
  }

  hasAnyRole(roles: string[]) {
    const current = this.user();
    return !!current && roles.some(role => current.roles.includes(role));
  }

  get apiBaseUrl() {
    return (window as Window & { __env?: { apiBaseUrl?: string } }).__env?.apiBaseUrl ?? 'http://localhost:8080';
  }

  private readUser(): UserSummary | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? (JSON.parse(raw) as UserSummary) : null;
  }
}
