import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private apiUrl = 'http://localhost:5162/api/assignments';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  createAssignment(payload: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload, { headers: this.getHeaders() });
  }

  submitAssignment(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/submit`, payload, { headers: this.getHeaders() });
  }

  gradeAssignment(submissionId: number, score: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/grade/${submissionId}`, { score }, { headers: this.getHeaders() });
  }

  getAssignmentsByCourse(courseId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/course/${courseId}`, { headers: this.getHeaders() });
  }

  getAssignmentsByLesson(lessonId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/lesson/${lessonId}`, { headers: this.getHeaders() });
  }

  getStudentAssignments(): Observable<{ pending: any[]; completed: any[] }> {
    return this.http.get<{ pending: any[]; completed: any[] }>(`${this.apiUrl}/student`, { headers: this.getHeaders() });
  }

  getSubmissionsForGrading(courseId: number, studentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/grading/course/${courseId}/student/${studentId}`, { headers: this.getHeaders() });
  }

  deleteAssignment(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  deleteAssignmentByLesson(lessonId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/lesson/${lessonId}`, { headers: this.getHeaders() });
  }
}