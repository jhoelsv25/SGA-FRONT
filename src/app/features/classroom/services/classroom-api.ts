import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ClassroomFeedItem, ChatMessage } from '../types/classroom-types';
import { DataResponse } from '@core/types/pagination-types';

@Injectable({ providedIn: 'root' })
export class ClassroomApi {
  private readonly http = inject(HttpClient);
  public baseUrl = 'classroom';

  getFeed(sectionCourseId: string): Observable<DataResponse<ClassroomFeedItem>> {
    return this.http.get<DataResponse<ClassroomFeedItem>>(`${this.baseUrl}/feed/${sectionCourseId}`);
  }

  getChatMessages(sectionCourseId: string): Observable<DataResponse<ChatMessage>> {
    return this.http.get<DataResponse<ChatMessage>>(`${this.baseUrl}/chat/${sectionCourseId}`);
  }

  publishPost(data: {
    content: string;
    attachments?: string[];
    sectionCourseId?: string;
  }): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.baseUrl}/publish`, data);
  }

  sendChatMessage(
    sectionCourseId: string,
    content: string
  ): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.baseUrl}/chat/${sectionCourseId}`, { content });
  }

  uploadFile(file: File): Observable<{ url: string; name: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; name: string }>(`${this.baseUrl}/upload`, formData);
  }
}
