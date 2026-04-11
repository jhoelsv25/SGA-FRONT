import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  AccountAuditResponse,
  AccountEmailLogResponse,
  AccountSessionResponse,
  AccountSystemSetting,
  AccountUserDetail,
  AccountUserPreferences,
  AuthResponse,
  LoginCredentials,
  RefreshTokenResponse,
  RoleResponse,
} from '@auth/types/auth-type';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  private http = inject(HttpClient);

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('auth/login', credentials);
  }

  getModulesByRole(id: string): Observable<RoleResponse> {
    return this.http.get<RoleResponse>(`auth/modules/${id}`);
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    return this.http.post<RefreshTokenResponse>('auth/refresh-token', {});
  }

  logout(): Observable<void> {
    return this.http.get<void>('auth/logout');
  }

  forgotPassword(username: string, birthdate: string): Observable<void> {
    return this.http.post<void>('auth/forgot-password', {
      username,
      birthdate,
    });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>('auth/reset-password', {
      token,
      newPassword,
    });
  }

  changePassword(userId: string, currentPassword: string, newPassword: string): Observable<void> {
    return this.http.patch<void>(`users/${userId}/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  getCurrentUserDetail(userId: string): Observable<AccountUserDetail> {
    return this.http.get<AccountUserDetail>(`users/${userId}`);
  }

  getCurrentUserAudit(userId: string, limit = 6): Observable<AccountAuditResponse> {
    return this.http.get<AccountAuditResponse>(`audit/user/${userId}`, {
      params: {
        page: 1,
        limit,
      },
    });
  }

  getCurrentUserSessions(
    userId: string,
    limit = 6,
    activeOnly = false,
  ): Observable<AccountSessionResponse> {
    return this.http.get<AccountSessionResponse>(`sessions/user/${userId}`, {
      params: {
        limit,
        active: activeOnly,
      },
    });
  }

  getCurrentUserEmailLogs(userId: string, limit = 6): Observable<AccountEmailLogResponse> {
    return this.http.get<AccountEmailLogResponse>(`email-logs/user/${userId}`, {
      params: { limit },
    });
  }

  getUserPreferences(userId: string): Observable<AccountUserPreferences> {
    return this.http.get<AccountUserPreferences>(`user-preferences/${userId}`);
  }

  updateUserPreferences(
    userId: string,
    preferences: Record<string, any>,
  ): Observable<AccountUserPreferences> {
    return this.http.patch<AccountUserPreferences>(`user-preferences/${userId}`, { preferences });
  }

  getSystemSetting(key: string): Observable<{ data: AccountSystemSetting }> {
    return this.http.get<{ data: AccountSystemSetting }>(`system-settings/${key}`);
  }

  updateSystemSetting(
    key: string,
    value: Record<string, any>,
  ): Observable<{ data: AccountSystemSetting }> {
    return this.http.patch<{ data: AccountSystemSetting }>(`system-settings/${key}`, { value });
  }

  checkToken(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>('auth/check-token');
  }
}
