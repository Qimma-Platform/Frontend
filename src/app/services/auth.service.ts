import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  private apiUrl = 'https://qimma.runasp.net/api/auth'; 

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      this.currentUserSubject.next({ token }); 
    }
  }

  login(credentials: any) {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem('jwt_token', response.token);
        localStorage.setItem('user_role', response.role);
        this.currentUserSubject.next(response);
      })
    );
  }

  verifyOtp(payload: any) {
    return this.http.post<any>(`${this.apiUrl}/verify-otp`, payload).pipe(
      tap(response => {
        localStorage.setItem('jwt_token', response.token);
        localStorage.setItem('user_role', response.role);
        this.currentUserSubject.next(response);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }
}