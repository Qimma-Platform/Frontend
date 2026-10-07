import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection!: signalR.HubConnection;
  
  public sessionStarted$ = new Subject<{ courseId: string; instructorName: string; courseTitle: string; meetUrl: string }>();
  public sessionEnded$ = new Subject<string>();

  public startConnection(): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      // FIXED: Point directly to the local API endpoint instead of the dead ngrok tunnel
      .withUrl('http://localhost:5162/liveHub')
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('SignalR Connected Successfully!'))
      .catch((err: unknown) => console.error('SignalR Connection Error:', err));

    this.hubConnection.on('SessionStarted', (courseId: string, instructorName: string, courseTitle: string, meetUrl: string) => {
      this.sessionStarted$.next({ courseId, instructorName, courseTitle, meetUrl });
    });

    this.hubConnection.on('SessionEnded', (courseId: string) => {
      this.sessionEnded$.next(courseId);
    });
  }

  public registerStudent(courseIds: string[]): void {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('RegisterStudent', courseIds).catch(err => console.error(err));
    } else {
      setTimeout(() => this.registerStudent(courseIds), 1000);
    }
  }

  public joinCourseGroup(courseId: string): void {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('JoinCourseGroup', courseId).catch(err => console.error(err));
    } else {
      setTimeout(() => this.joinCourseGroup(courseId), 1000);
    }
  }

  public leaveCourseGroup(courseId: string): void {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('LeaveCourseGroup', courseId).catch(err => console.error(err));
    }
  }

  public startSession(courseId: string, instructorName: string, courseTitle: string, meetUrl: string): void {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('StartLiveSession', courseId, instructorName, courseTitle, meetUrl).catch(err => console.error(err));
    } else {
      setTimeout(() => this.startSession(courseId, instructorName, courseTitle, meetUrl), 1000);
    }
  }

  public endSession(courseId: string): void {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('EndLiveSession', courseId).catch(err => console.error(err));
    }
  }
}