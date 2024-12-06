import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable, forwardRef } from '@angular/core';
import {
  BehaviorSubject,
  Subject,
  Subscription,
  catchError,
  combineLatest,
  distinctUntilChanged,
  from,
  tap,
  throwError,
} from 'rxjs';
import { Guild } from '../../interfaces/interface';
import { environment } from '../../../environment';
import { ActivatedRoute } from '@angular/router';
import { Socket } from 'socket.io-client';
import { SocketService } from '../../main-frame/services/socket.service';
import { PlayerService } from '../player/services/player.service';

export enum RepeatMode {
  OFF = 'off',
  QUEUE = 'queue',
  TRACK = 'track',
}

@Injectable({
  providedIn: 'root',
})
export class GuildContentService {
  private current$ = new Subject<any>();
  private tracks$ = new Subject<any>();
  private guild$ = new Subject<Guild>();
  private previousTrack$ = new BehaviorSubject<any>(null);
  private RepeatMode$ = new BehaviorSubject<RepeatMode>(RepeatMode.OFF);

  private playing$ = new BehaviorSubject<boolean>(false);
  private playing!: boolean;

  private queue!: Socket<any, any>;
  private _guild: Guild = { id: '', name: '' };
  private currentEventListenerId: string | null = null;

  private currentTrack: any;
  private previousTrack: any;
  private tracks!: any[];

  constructor(
    private httpService: HttpClient,
    private socketService: SocketService // @Inject(forwardRef(() => PlayerService)) private playerService: PlayerService
  ) {
    //     this.current$
    //   .pipe(
    //     distinctUntilChanged((prev, curr) => {
    //       console.log('Previous current track:', prev.track.info.identifier);
    //       console.log('Current current track:', curr.track.info.identifier);
    //       return prev.track.info.identifier === curr.track.info.identifier;
    //     })
    //   )
    //   .subscribe((updatedTrack) => {
    //     console.log('Current track updated:', updatedTrack);
    //   });
    // // Debugging tracks updates
    // this.tracks$
    //   .pipe(
    //     distinctUntilChanged((prev, curr) => {
    //       // Log the previous and current tracks for debugging
    //       console.log('Previous tracks:', prev.length);
    //       console.log('Current tracks:', curr.length);
    //       // Check length difference
    //       if (prev.length !== curr.length) {
    //         console.log('Length mismatch detected');
    //         return false; // Return false if lengths differ
    //       }
    //       console.log('Length match detected');
    //       return true; // Return true if lengths are the same
    //     })
    //   )
    //   .subscribe((updatedTracks) => {
    //     console.log('Tracks updated:', updatedTracks);
    //   });
    // // Debugging previous track updates
    // this.previousTrack$
    //   .pipe(
    //     distinctUntilChanged((prev, curr) => {
    //       // Log the previous and current previous tracks for debugging
    //       console.log('Previous previous track:', prev);
    //       console.log('Current previous track:', curr);
    //       return prev=== curr;
    //     })
    //   )
    //   .subscribe((updatedPreviousTrack) => {
    //     console.log('Previous track updated:', updatedPreviousTrack);
    //   });
  }

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

  public getPreviousTrack$() {
    return this.previousTrack$.asObservable();
  }

  public updateCurrent(current: any) {
    this.currentTrack = current;
    this.current$.next(current);
  }

  public updateTracks(tracks: any) {
    this.tracks = tracks;
    this.tracks$.next(tracks);
  }

  public updatePreviousTrack$(previousTrack: any) {
    this.previousTrack = previousTrack;
    this.previousTrack$.next(previousTrack);
  }

  updateRepeatMode$(repeatMode: RepeatMode) {
    this.RepeatMode$.next(repeatMode);
  }

  getRepeatMode$() {
    return this.RepeatMode$.asObservable();
  }

  updatePlaying$(playing: boolean) {
    this.playing = playing;
    this.playing$.next(playing);
  }

  getPlaying$() {
    return this.playing$.asObservable();
  }

  public playTrack(i: number) {
    this.httpService
      .post(`${environment.API_ENDPOINT}/discord/play`, {
        guildID: this._guild.id,
        index: i,
      })
      .subscribe({ next: (response) => console.log(response) });
  }

  public playPreviousTrack() {
    this.httpService
      .post(`${environment.API_ENDPOINT}/discord/skip-back`, {
        guildID: this._guild.id,
      })
      .subscribe({ next: (response) => console.log(response) });
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

    this.getQueueInit(this._guild).subscribe((data) => {
      console.log('INIT CURRENT: ', data);
      if (!data) return;
      this.updateCurrent(data.current);
      this.updatePreviousTrack$(data.previousTrack);
      this.updateTracks(data.tracks);
      this.updateRepeatMode$(data.repeatMode);
      this.updatePlaying$(data.playing);
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
    const trackUpdate = `tracksUpdate:${this._guild.id}`;

    this.currentEventListenerId = this._guild.id;

    this.queue.on(queueUpdate, (data: any) => this.eventHandlerQueue(data));
    this.queue.on(trackUpdate, (data: any) => this.eventHandlerTracks(data));
    // this.queue.on(playerTimeUpdate, (data: any) => this.eventHandlerTime(data));
  }

  private removeEventListener(guildId: string): void {
    if (!guildId) {
      return;
    }

    const previousQueueUpdate = `queueUpdate:${guildId}`;
    const previousTracksUpdate = `tracksUpdate:${guildId}`;
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
    this.updateCurrent(data?.current);

    this.updateTracks(data?.tracks);

    this.updatePreviousTrack$(data?.previousTrack);

    console.log('Queue update received:', data);
  }

  private eventHandlerTracks(data: any) {
    console.log('Updating solo trackssssssssssss ', data);
    this.updateTracks(data);
  }

  private hasTrackChanged(newTrack: any): boolean {
    return (
      this.currentTrack.track.info.identifier !==
      newTrack?.track.info.identifier
    );
  }

  private hasTracksChanged(newTracks: any[]): boolean {
    if (this.tracks?.length !== newTracks?.length) return true;
    return false;
  }

  private hasPreviousTrackChanged(newPreviousTrack: any): boolean {
    return (
      this.previousTrack.info.identifier !== newPreviousTrack.info.identifier
    );
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
