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

  /** Publicar en el muro. Backend: content obligatorio; attachmentUrl opcional (una URL). */
  publishPost(data: {
    content: string;
    attachments?: string[];
    attachmentUrl?: string;
    sectionCourseId?: string;
  }): Observable<{ id: string }> {
    const body = {
      content: data.content,
      sectionCourseId: data.sectionCourseId,
      attachmentUrl: data.attachmentUrl ?? data.attachments?.[0],
    };
    return this.http.post<{ id: string }>(`${this.baseUrl}/publish`, body);
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

  /** Profesores asignados al curso-sección. Backend puede exponer GET classroom/:sectionCourseId/teachers */
  getTeachers(sectionCourseId: string): Observable<Array<{ id: string; firstName: string; lastName: string; email?: string }>> {
    return this.http.get<Array<{ id: string; firstName: string; lastName: string; email?: string }>>(
      `${this.baseUrl}/${sectionCourseId}/teachers`
    );
  }

  getPeople(sectionCourseId: string): Observable<ClassroomPeopleResponse> {
    return this.http.get<ClassroomPeopleResponse>(`${this.baseUrl}/${sectionCourseId}/people`);
  }

  /** Tareas/entregas del aula. Backend: GET classroom/:sectionCourseId/tasks */
  getTasks(sectionCourseId: string): Observable<ClassroomTask[]> {
    return this.http.get<ClassroomTask[]>(`${this.baseUrl}/${sectionCourseId}/tasks`);
  }

  getGrades(sectionCourseId: string): Observable<ClassroomGradesResponse> {
    return this.http.get<ClassroomGradesResponse>(`${this.baseUrl}/${sectionCourseId}/grades`);
  }
}

export interface ClassroomTask {
  id: string;
  title: string;
  date: string;
  status: 'pending' | 'delivered' | 'graded' | 'late';
  points: number;
  grade?: number;
  submissionSummary?: {
    deliveredCount: number;
    gradedCount: number;
    pendingCount: number;
  };
  studentSubmissions?: Array<{
    studentId?: string;
    studentName: string;
    status: 'pending' | 'delivered' | 'graded' | 'late';
    score?: number;
    submittedAt?: string;
    feedback?: string;
  }>;
}

export interface ClassroomGradeScore {
  id: string;
  studentId: string;
  studentName: string;
  score: number;
  observation?: string;
}

export interface ClassroomTeacherRow {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface ClassroomStudentRow {
  id: string;
  name: string;
  code: string;
}

export interface ClassroomPeopleResponse {
  teachers: ClassroomTeacherRow[];
  students: ClassroomStudentRow[];
}

export interface ClassroomGradeRecord {
  id: string;
  name: string;
  date: string;
  total: number;
  average: number;
  studentsCount: number;
  scores: ClassroomGradeScore[];
}

export interface ClassroomGradesResponse {
  data: ClassroomGradeRecord[];
  summary: {
    assessments: number;
    scores: number;
    average: number;
  };
}
