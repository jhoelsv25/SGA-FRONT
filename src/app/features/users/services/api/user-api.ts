import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { DataResponse } from '@core/types/pagination-types';
import { User, UserResponse } from '@features/users/types/user-types';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserApi {
  private readonly http = inject(HttpClient);
  public baseUrl = 'users';

  getAll(params: Params = {}): Observable<DataResponse<User>> {
    return this.http.get<DataResponse<User>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  create(user: Partial<User>): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.baseUrl, user);
  }

  update(id: string, user: Partial<User>): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/${id}`, user);
  }

  delete(id: string): Observable<UserResponse> {
    return this.http.delete<UserResponse>(`${this.baseUrl}/${id}`);
  }
}
