// src/app/core/auth/auth.service.ts
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, tap } from 'rxjs';
import { AuthReq, AuthResp, RegisterReq, User } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private platformId = inject(PLATFORM_ID);
  private _tokenKey = 'ip_token';
  private _roleKey = 'ip_role';

  private _user$ = new BehaviorSubject<User | null>(null);
  user$ = this._user$.asObservable();

  // helper seguro
  private get storage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? localStorage : null;
  }

  get token(): string | null {
    return this.storage?.getItem(this._tokenKey) ?? null;
  }

  get role(): string | null {
    return this.storage?.getItem(this._roleKey) ?? null;
  }

  get isLoggedIn(): boolean {
    // En SSR siempre false (no hay storage)
    return !!this.token;
  }

// src/app/core/auth/auth.service.ts
login(payload: { identifier?: string; password: string }) {
  // Normaliza: si viene usernameOrEmail, lo mapeamos a identifier
  const body: AuthReq = {
    identifier: payload.identifier ?? '',
    password: payload.password
  };
  return this.http.post<AuthResp>(`${this.base}/auth/login`, body).pipe(
    tap(res => {
      this.storage?.setItem(this._tokenKey, res.token);
      if (res.role) this.storage?.setItem(this._roleKey, res.role);
    }),
    tap(() => this.me().subscribe())
  );
}


  register(payload: RegisterReq) {
    return this.http.post<void>(`${this.base}/auth/register`, payload);
  }

  me() {
    return this.http.get<User>(`${this.base}/users/me`).pipe(
      tap(user => this._user$.next(user))
    );
  }

  logout() {
    this.storage?.removeItem(this._tokenKey);
    this.storage?.removeItem(this._roleKey);
    this._user$.next(null);
  }
}
