import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, tap } from 'rxjs';
import {
  AuthReq,
  AuthResp,
  RegisterReq,
  RegisterStep1Req,
  RegisterStep1Resp,
  RegisterStep2Req,
  RegisterStep3Req,
  RegisterStep4Req,
  User
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private platformId = inject(PLATFORM_ID);
  private _tokenKey = 'ip_token';
  private _roleKey = 'ip_role';
  private _onboardingTokenKey = 'ip_onboarding_token';

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

  get onboardingToken(): string | null {
    return this.storage?.getItem(this._onboardingTokenKey) ?? null;
  }

  get isLoggedIn(): boolean {
    // En SSR siempre false (no hay storage)
    return !!this.token;
  }

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

  // ===== Registro multi-paso =====
  registerStep1(payload: RegisterStep1Req) {
    return this.http.post<RegisterStep1Resp>(`${this.base}/auth/register/step1`, payload).pipe(
      tap(res => this.storage?.setItem(this._onboardingTokenKey, res.onboardingToken))
    );
  }

  registerStep2(payload: RegisterStep2Req) {
    return this.http.post<void>(`${this.base}/auth/register/step2`, payload);
  }

  registerStep3(payload: RegisterStep3Req) {
    return this.http.post<void>(`${this.base}/auth/register/step3`, payload);
  }

  registerStep4(payload: RegisterStep4Req) {
    return this.http.post<AuthResp>(`${this.base}/auth/register/step4`, payload).pipe(
      tap(res => {
        this.storage?.setItem(this._tokenKey, res.token);
        if (res.role) this.storage?.setItem(this._roleKey, res.role);
        this.storage?.removeItem(this._onboardingTokenKey);
      }),
      tap(() => this.me().subscribe())
    );
  }

  clearOnboarding() {
    this.storage?.removeItem(this._onboardingTokenKey);
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
