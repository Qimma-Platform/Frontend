import { Injectable, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private hubConnection: signalR.HubConnection | undefined;
  private authService = inject(AuthService);
  
  private notificationSubject = new Subject<{ message: string, feedback: string }>();
  public notifications$ = this.notificationSubject.asObservable();

  public startConnection() {
    const token = this.authService.getToken();
    if (!token) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      
      .withUrl('https://localhost:7225/hubs/notifications', {
        accessTokenFactory: () => token 
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connection started!'))
      .catch(err => console.error('Error while starting SignalR connection: ' + err));

    this.hubConnection.on('ReceiveNotification', (message: string, feedback: string) => {
      this.notificationSubject.next({ message, feedback });
    });
  }
}