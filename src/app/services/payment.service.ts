import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'https://brynlee-subpeltated-radia.ngrok-free.dev'; 

  constructor(private http: HttpClient) { }

  checkoutCourse(courseId: number): Observable<{ message: string, checkoutUrl: string }> {
    return this.http.post<{ message: string, checkoutUrl: string }>(`${this.apiUrl}/checkout/${courseId}`, {});
  }
}