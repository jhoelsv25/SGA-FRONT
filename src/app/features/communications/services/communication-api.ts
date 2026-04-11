import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Communication,
  CommunicationCreate,
  CommunicationResponse,
  CommunicationsListResponse,
  CommunicationUpdate,
} from '../types/communication-types';
import { AuthStore } from '@auth/services/store/auth.store';

@Injectable({ providedIn: 'root' })
export class CommunicationApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'announcements';
  private readonly authStore = inject(AuthStore);

  private mapFromApi(item: any): Communication {
    const publishedAt = item.publishedAt ?? null;
    const isScheduled =
      item.status === 'draft' && publishedAt && new Date(publishedAt).getTime() > Date.now();
    return {
      id: item.id,
      subject: item.title,
      body: item.content,
      type: 'announcement',
      status: item.status === 'published' ? 'sent' : isScheduled ? 'scheduled' : 'draft',
      audience: item.recipient,
      sectionId: item.section?.id ?? item.sectionId ?? null,
      sectionName: item.section?.name ?? null,
      sentAt: item.publishedAt,
      createdAt: item.createdAt,
      recipientCount: item.recipientCount ?? 0,
      createdBy: item.user?.username ?? undefined,
    };
  }

  private mapToApi(data: CommunicationCreate | CommunicationUpdate): any {
    const publishedAt = data.scheduledAt ? new Date(data.scheduledAt) : new Date();
    const expireAt = new Date(publishedAt);
    expireAt.setDate(expireAt.getDate() + 7);
    const status = data.scheduledAt ? 'draft' : data.status === 'draft' ? 'draft' : 'published';

    return {
      title: data.subject,
      content: data.body ?? '',
      recipient: data.audience,
      publishedAt: publishedAt.toISOString(),
      expireAt: expireAt.toISOString(),
      priority: data.priority ?? 'medium',
      status,
      user: this.authStore.currentUser()?.id,
      section: data.sectionId || undefined,
      ...(data.attachmentUrl ? { attachmentUrl: data.attachmentUrl } : {}),
      view: 0,
    };
  }

  getAll(params?: Params): Observable<CommunicationsListResponse> {
    return this.http
      .get<{ data: any[]; message?: string }>(this.baseUrl, { params: params ?? {} })
      .pipe(
        map((res) => ({ ...res, data: (res.data ?? []).map((item) => this.mapFromApi(item)) })),
      );
  }

  getById(id: string): Observable<CommunicationResponse> {
    return this.http
      .get<{ data: any; message: string }>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => ({ ...res, data: this.mapFromApi(res.data) })));
  }

  create(data: CommunicationCreate): Observable<CommunicationResponse> {
    return this.http
      .post<{ data: any; message: string }>(this.baseUrl, this.mapToApi(data))
      .pipe(map((res) => ({ ...res, data: this.mapFromApi(res.data) })));
  }

  update(id: string, data: CommunicationUpdate): Observable<CommunicationResponse> {
    return this.http
      .patch<{ data: any; message: string }>(`${this.baseUrl}/${id}`, this.mapToApi(data))
      .pipe(map((res) => ({ ...res, data: this.mapFromApi(res.data) })));
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
