import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Subject,
  Subscription,
  catchError,
  combineLatest,
  tap,
  throwError,
} from 'rxjs';
import { Guild } from '../../interfaces/interface';
import { environment } from '../../../environment';
import { ActivatedRoute } from '@angular/router';
import { Socket } from 'socket.io-client';
import { SocketService } from '../../main-frame/services/socket.service';
@Injectable({
  providedIn: 'root',
})
export class GuildContentService {
  private current$ = new Subject<any>();
  private tracks$ = new Subject<any>();
  private guild$ = new Subject<Guild>();
  private queue!: Socket<any, any>;
  private _guild: Guild = { id: '', name: '' };
  private currentEventListenerId: string | null = null;

  constructor(
    private httpService: HttpClient,
    private socketService: SocketService
  ) {}

  public getQueueSocket() {
    return this.queue;
  }

  public getCurrent$() {
    return this.current$.asObservable();
  }

  public getTracks$() {
    return this.tracks$.asObservable();
  }

  public getGuild$() {
    return this.guild$.asObservable();
  }

  public updateCurrent(current: any) {
    this.current$.next(current);
  }

  public updateTracks(tracks: any) {
    this.tracks$.next(tracks);
  }

  get guild(): Guild {
    return this._guild;
  }

  public moveTrack(from: number, to: number) {
    console.log(this._guild.id);
    this.httpService.post(`${environment.API_ENDPOINT}/discord/player/move`, {
      guildID: this._guild.id,
      position: { from: from, to: to },
    });
  }

  public initializeSocketConnection(params: any) {
    return this.socketService.getConnectionStatus().pipe(
      tap((isConnected) => {
        if (isConnected) {
          this.queue = this.socketService.getSocket();
          this.handleParamChange(params);
          this.setupListeners();
        }
      })
    );
  }

  private handleParamChange(params: any): void {
    console.log('Previous Guild ID:', this._guild?.id);

    if (this._guild?.id) {
      this.removeEventListener(this._guild.id);
    }

    this.updateGuildFromParams(params);

    this.getQueueInit(this._guild).subscribe(({ current, tracks }) => {
      console.log('INIT CURRENT: ', current);
      this.updateCurrent(current);
      this.updateTracks(tracks);
    });
  }

  private updateGuildFromParams(params: any): void {
    this._guild.id = params['id'];
    console.log('Switched to Guild:', this._guild?.id);
    this.guild$.next(this._guild);
  }

  private setupListeners(): void {
    if (!this._guild?.id) {
      return;
    }

    if (this.currentEventListenerId !== this._guild.id) {
      this.removeEventListener(this.currentEventListenerId as string);
    }

    const queueUpdate = `queueUpdate:${this._guild.id}`;
    const playerTimeUpdate = `playerTimeUpdate:${this._guild.id}`;

    this.currentEventListenerId = this._guild.id;

    this.queue.on(queueUpdate, (data: any) => this.eventHandlerQueue(data));
    // this.queue.on(playerTimeUpdate, (data: any) => this.eventHandlerTime(data));

    console.log(
      `Listening for updates on: ${queueUpdate} and ${playerTimeUpdate}`
    );
  }

  private removeEventListener(guildId: string): void {
    if (!guildId) {
      return;
    }

    const previousQueueUpdate = `queueUpdate:${guildId}`;
    const previousPlayerTimeUpdate = `playerTimeUpdate:${guildId}`;

    if (this.currentEventListenerId === guildId) {
      this.queue.off(previousQueueUpdate);
      this.queue.off(previousPlayerTimeUpdate);
      console.log(
        `Removed listeners for: ${previousQueueUpdate} and ${previousPlayerTimeUpdate}`
      );
    }

    this.currentEventListenerId = null;
  }

  private eventHandlerQueue(data: any): void {
    console.log(data?.current);
    if (!data) return;
    this.updateCurrent(data.current);
    this.updateTracks(data.tracks);
    console.log('Queue update received:', data.current);
  }

  private eventHandlerTime(data: any): void {
    console.log('TOMANOCUUUUUUUUUUUUUU', data);
    // this.updateTime(data);
  }

  public getQueueInit(_guild: Guild | null) {
    return this.httpService
      .get<any>(
        `${environment.API_ENDPOINT}/discord/queue?guildID=${_guild!.id}`
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching guild data:', error.message);
          return throwError(() => new Error('Failed to fetch guild data.'));
        })
      );
  }
}
