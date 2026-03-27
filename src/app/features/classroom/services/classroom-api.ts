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

  createComment(sectionCourseId: string, postId: string, content: string): Observable<ClassroomFeedItem> {
    return this.http.post<ClassroomFeedItem>(`${this.baseUrl}/${sectionCourseId}/posts/${postId}/comments`, { content });
  }

  updatePost(
    sectionCourseId: string,
    postId: string,
    data: { content?: string; attachmentUrl?: string | null },
  ): Observable<ClassroomFeedItem> {
    return this.http.patch<ClassroomFeedItem>(`${this.baseUrl}/${sectionCourseId}/posts/${postId}`, data);
  }

  deletePost(sectionCourseId: string, postId: string): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(`${this.baseUrl}/${sectionCourseId}/posts/${postId}`);
  }

  updateComment(sectionCourseId: string, postId: string, commentId: string, content: string): Observable<ClassroomFeedItem> {
    return this.http.patch<ClassroomFeedItem>(
      `${this.baseUrl}/${sectionCourseId}/posts/${postId}/comments/${commentId}`,
      { content },
    );
  }

  deleteComment(sectionCourseId: string, postId: string, commentId: string): Observable<ClassroomFeedItem> {
    return this.http.delete<ClassroomFeedItem>(`${this.baseUrl}/${sectionCourseId}/posts/${postId}/comments/${commentId}`);
  }

  sendChatMessage(
    sectionCourseId: string,
    content: string
  ): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.baseUrl}/chat/${sectionCourseId}`, { content });
  }

  uploadFile(
    file: File,
    options?: { category?: string; entityCode?: string; preserveName?: boolean },
  ): Observable<{ url: string; name: string; storedName?: string; category?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.category) formData.append('category', options.category);
    if (options?.entityCode) formData.append('entityCode', options.entityCode);
    if (options?.preserveName !== undefined) formData.append('preserveName', String(options.preserveName));
    return this.http.post<{ url: string; name: string; storedName?: string; category?: string }>(`uploads`, formData);
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

  getTaskEditor(sectionCourseId: string, assignmentId: string): Observable<ClassroomTaskEditorPayload> {
    return this.http.get<ClassroomTaskEditorPayload>(`${this.baseUrl}/${sectionCourseId}/tasks/${assignmentId}/editor`);
  }

  createTask(
    sectionCourseId: string,
    data: {
      title: string;
      description?: string;
      instructions?: string;
      dueDate: string;
      maxScore?: number;
      lateSubmissionAllowed?: boolean;
      maxAttempts?: number;
      type?: 'homework' | 'project' | 'quiz' | 'exam' | string;
      resourceUrl?: string;
      questions?: Array<{
        prompt: string;
        type: 'single_choice' | 'multiple_choice' | 'short_answer';
        points?: number;
        required?: boolean;
        options?: Array<{ label: string; isCorrect?: boolean }>;
      }>;
    },
  ): Observable<ClassroomTask> {
    return this.http.post<ClassroomTask>(`${this.baseUrl}/${sectionCourseId}/tasks`, data);
  }

  updateTask(
    sectionCourseId: string,
    assignmentId: string,
    data: {
      title: string;
      description?: string;
      instructions?: string;
      dueDate: string;
      maxScore?: number;
      lateSubmissionAllowed?: boolean;
      maxAttempts?: number;
      type?: 'homework' | 'project' | 'quiz' | 'exam' | string;
      resourceUrl?: string;
      questions?: Array<{
        prompt: string;
        type: 'single_choice' | 'multiple_choice' | 'short_answer';
        points?: number;
        required?: boolean;
        options?: Array<{ label: string; isCorrect?: boolean }>;
      }>;
    },
  ): Observable<ClassroomTaskEditorPayload> {
    return this.http.patch<ClassroomTaskEditorPayload>(`${this.baseUrl}/${sectionCourseId}/tasks/${assignmentId}`, data);
  }

  deleteTask(sectionCourseId: string, assignmentId: string): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(`${this.baseUrl}/${sectionCourseId}/tasks/${assignmentId}`);
  }

  createTaskComment(sectionCourseId: string, assignmentId: string, content: string): Observable<ClassroomTask> {
    return this.http.post<ClassroomTask>(`${this.baseUrl}/${sectionCourseId}/tasks/${assignmentId}/comments`, { content });
  }

  updateTaskComment(
    sectionCourseId: string,
    assignmentId: string,
    commentId: string,
    content: string,
  ): Observable<ClassroomTask> {
    return this.http.patch<ClassroomTask>(
      `${this.baseUrl}/${sectionCourseId}/tasks/${assignmentId}/comments/${commentId}`,
      { content },
    );
  }

  deleteTaskComment(sectionCourseId: string, assignmentId: string, commentId: string): Observable<ClassroomTask> {
    return this.http.delete<ClassroomTask>(`${this.baseUrl}/${sectionCourseId}/tasks/${assignmentId}/comments/${commentId}`);
  }

  submitTask(
    sectionCourseId: string,
    assignmentId: string,
    data: {
      submissionText?: string;
      fileUrl?: string;
      fileName?: string;
      linkUrl?: string;
      answers?: Array<{
        questionId: string;
        selectedOptionIds?: string[];
        answerText?: string;
      }>;
    },
  ): Observable<{ id: string; status: ClassroomTask['status']; submittedAt: string; score?: number }> {
    return this.http.post<{ id: string; status: ClassroomTask['status']; submittedAt: string; score?: number }>(
      `${this.baseUrl}/${sectionCourseId}/tasks/${assignmentId}/submit`,
      data,
    );
  }

  reviewTaskSubmission(
    sectionCourseId: string,
    assignmentId: string,
    submissionId: string,
    data: { score: number; feedback?: string },
  ): Observable<{ id: string; score: number; feedback?: string; status: ClassroomTask['status'] }> {
    return this.http.patch<{ id: string; score: number; feedback?: string; status: ClassroomTask['status'] }>(
      `${this.baseUrl}/${sectionCourseId}/tasks/${assignmentId}/submissions/${submissionId}/review`,
      data,
    );
  }

  getGrades(sectionCourseId: string): Observable<ClassroomGradesResponse> {
    return this.http.get<ClassroomGradesResponse>(`${this.baseUrl}/${sectionCourseId}/grades`);
  }
}

export interface ClassroomTask {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  date: string;
  type?: string;
  resourceUrl?: string;
  questionsCount?: number;
  questions?: Array<{
    id: string;
    prompt: string;
    type: 'single_choice' | 'multiple_choice' | 'short_answer';
    points: number;
    required: boolean;
    options: Array<{ id: string; label: string }>;
  }>;
  status: 'pending' | 'delivered' | 'graded' | 'late';
  points: number;
  grade?: number;
  commentsCount?: number;
  comments?: Array<{
    id: string;
    content: string;
    date: string;
    author: {
      id?: string;
      name: string;
      avatar?: string;
      role?: string;
    };
  }>;
  submissionSummary?: {
    deliveredCount: number;
    gradedCount: number;
    pendingCount: number;
  };
  studentSubmissions?: Array<{
    submissionId?: string;
    studentId?: string;
    studentName: string;
    status: 'pending' | 'delivered' | 'graded' | 'late';
    score?: number;
    submittedAt?: string;
    feedback?: string;
  }>;
}

export interface ClassroomTaskEditorPayload {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate: string;
  maxScore: number;
  maxAttempts: number;
  lateSubmissionAllowed: boolean;
  type: 'homework' | 'project' | 'quiz' | 'exam' | string;
  resourceUrl?: string;
  questions: Array<{
    id: string;
    prompt: string;
    type: 'single_choice' | 'multiple_choice' | 'short_answer';
    points: number;
    required: boolean;
    options: Array<{ id: string; label: string; isCorrect: boolean }>;
  }>;
}

export interface ClassroomGradeScore {
  id: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  studentPhotoUrl?: string;
  score: number;
  gradeLabel?: string;
  observation?: string;
}

export interface ClassroomTeacherRow {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  photoUrl?: string;
  role?: string;
}

export interface ClassroomStudentRow {
  id: string;
  name: string;
  code: string;
  photoUrl?: string;
  status?: string;
}

export interface ClassroomPeopleResponse {
  teachers: ClassroomTeacherRow[];
  students: ClassroomStudentRow[];
}

export interface ClassroomGradeRecord {
  id: string;
  name: string;
  description?: string;
  date: string;
  total: number;
  type?: string;
  status?: string;
  weightPercentage?: number;
  period?: {
    id: string;
    name: string;
    periodNumber?: number;
  };
  competency?: {
    id: string;
    code: string;
    name: string;
  };
  average: number;
  averageLabel?: string;
  studentsCount: number;
  scores: ClassroomGradeScore[];
}

export interface ClassroomGradesResponse {
  data: ClassroomGradeRecord[];
  summary: {
    assessments: number;
    scores: number;
    average: number;
    averageLabel?: string;
  };
}
