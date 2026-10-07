import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = 'http://localhost:5162/api/course';

  constructor(private http: HttpClient) { }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  createCourse(courseData: any): Observable<any> {
    return this.http.post(this.apiUrl, courseData, { headers: this.getHeaders() });
  }

  getAllCourses(): Observable<any> {
    return this.http.get(this.apiUrl, { headers: this.getHeaders() });
  }

  enrollInCourse(courseId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/enroll/${courseId}`, {}, { headers: this.getHeaders() });
  }

  getMyCourses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-courses`, { headers: this.getHeaders() });
  }

  getInstructorCourses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/instructor-courses`, { headers: this.getHeaders() });
  }

  getCourseById(courseId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${courseId}`, { headers: this.getHeaders() });
  }

  getCourseLessons(courseId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${courseId}/lessons`, { headers: this.getHeaders() });
  }

  addLesson(courseId: number, lessonData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${courseId}/lessons`, lessonData, { headers: this.getHeaders() });
  }

  updateLesson(courseId: number, lessonId: number, lessonData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${courseId}/lessons/${lessonId}`, lessonData, { headers: this.getHeaders() });
  }

  deleteLesson(courseId: number, lessonId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${courseId}/lessons/${lessonId}`, { headers: this.getHeaders() });
  }

  deleteCourse(courseId: number) {
    return this.http.delete(`${this.apiUrl}/${courseId}`, { headers: this.getHeaders() });
  }
}