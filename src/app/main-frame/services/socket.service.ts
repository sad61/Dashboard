import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { Socket, io } from 'socket.io-client';
import { environment } from '../../../environment';
@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private readonly maxRetries = 5;
  private readonly retryDelay = 2000;
  private socket$ = new BehaviorSubject<Socket | null>(null);
  private socket!: Socket;
  private isConnected$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.connectWithRetry();
  }

  getSocket$() {
    return this.socket$;
  }

  private connectWithRetry() {
    let retries = 0;

    const connect = () => {
      this.socket = io(`${environment.SOCKET_ENDPOINT}`);


      this.socket.on('connect', () => {
        retries = 0;
        console.log('Connected to WebSocket');
        this.socket$.next(this.socket);
        this.isConnected$.next(true);
      });
      this.socket.on('connect_error', (error) => {
        this.isConnected$.next(false); 
        if (retries < this.maxRetries) {
          retries++;
          console.log(`Retrying connection... (${retries})`);
          setTimeout(() => {
            this.socket.disconnect();
            connect();
          }, this.retryDelay);
        } else {
          console.error('Max retries reached. Could not connect to WebSocket.');
          this.socket.disconnect();
        }
      });
    };

    connect();
  }

  public getConnectionStatus(): Observable<boolean> {
    return this.isConnected$.asObservable();
  }

  public getSocket(): Socket {
    return this.socket;
  }
}
