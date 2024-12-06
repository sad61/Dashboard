import { Inject, Injectable, forwardRef } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  catchError,
  lastValueFrom,
  map,
  repeat,
  switchMap,
  throwError,
} from 'rxjs';
import { environment } from '../../../../environment';
import { SocketService } from '../../../main-frame/services/socket.service';
import { Socket } from 'socket.io-client';
import { Guild } from '../../../interfaces/interface';
import { ActivatedRoute } from '@angular/router';
import { GeneralService } from '../../../general.service';
import {
  GuildContentService,
  RepeatMode,
} from '../../services/guild-content.service';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private source$ = new BehaviorSubject<string | null>('');
  private source!: string | null;

  private IFrame$ = new BehaviorSubject<any>(null);

  private EmbedController$ = new BehaviorSubject<any>(null);
  private EmbedController!: any;

  private Player$ = new BehaviorSubject<any>(null);

  private synchronizing$ = new BehaviorSubject<boolean>(false);
  private suppressStateChange$ = new BehaviorSubject<boolean>(false)

  private previousTrack$ = new BehaviorSubject<any>(null);

  private repeatMode$ = new BehaviorSubject<RepeatMode>(RepeatMode.OFF)

  private playBackPosition$ = new BehaviorSubject<any>(null);

  private guildID!: any;

  private player!: any;
  private intervalID!: any;

  private playing!: boolean;

  socketSub!: Subscription;
  private socket!: Socket<any, any> | null;

  private current!: any;

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
    private route: ActivatedRoute,
    private generalService: GeneralService,
    @Inject(forwardRef(() => GuildContentService))
    private guildContentService: GuildContentService
  ) {
    this.socketSub = this.socketService.getSocket$().subscribe({
      next: (socket) => {
        this.socket = socket;
      },
    });

    this.guildContentService.getCurrent$().subscribe((current) => {
      this.current = current;
    });

    this.guildContentService.getPlaying$().subscribe((playing) => {
      this.playing = playing;
    });

    this.guildContentService.getGuild$().subscribe((guild) => {
      this.guildID = guild.id
      this.setupListener(this.guildID)
    })
  }



  updatePrevious$(track: any) {
    this.previousTrack$.next(track);
  }

  getPrevious$() {
    return this.previousTrack$.asObservable();
  }

  updateRepeatMode(repeatMode: RepeatMode) {
    this.repeatMode$.next(repeatMode)
  }

  getRepeatMode() {
    return this.repeatMode$.asObservable()
  }

  updateSynchronizing$(synch: boolean) {
    this.synchronizing$.next(synch);
  }

  getSynchronizing$() {
    return this.synchronizing$.asObservable();
  }

  updateSuppressStateChange$(suppressStateChange: boolean) {
    this.suppressStateChange$.next(suppressStateChange)
  }

  getSuppressStateChange() {
    return this.suppressStateChange$.asObservable();
  }

  updateSource$(source: string | null) {
    this.source = source;
    this.source$.next(source);
  }

  getSource$() {
    return this.source$.asObservable();
  }

  updateIFrame$(IFrame: any) {
    this.IFrame$.next(IFrame);
  }

  getIFrame$() {
    return this.IFrame$.asObservable();
  }

  updateEmbedController$(EmbedController: any) {
    this.EmbedController = EmbedController;
    this.EmbedController$.next(EmbedController);
  }

  getEmbedController$() {
    return this.EmbedController$.asObservable();
  }

  updatePlayer$(Player: any) {
    this.player = Player;
    this.Player$.next(Player);
  }

  getPlayer$() {
    return this.Player$.asObservable();
  }

  updatePlaybackPosition$(position: number) {
    this.playBackPosition$.next(position);
  }

  getPlaybackPosition$() {
    return this.playBackPosition$.asObservable();
  }

  pauseYoutubePlayer(emitToServer: boolean, guildID: string): void {
    console.log('Trying to pause player???')
    if (emitToServer) {
      this.socket?.emit('pause', { guildID: guildID, pause: 'pause' });
      console.log('Emiting pause event to guild: ', guildID);
    }
    this.guildContentService.updatePlaying$(false);
    this.player.pauseVideo();
  }

  pauseSpotifyPlayer(emitToServer: boolean, guildID: string): void {
    if (emitToServer) {
      this.socket?.emit('pause', { guildID: guildID, pause: 'pause' });
      console.log('Emiting pause event: ', true);
    }
    this.guildContentService.updatePlaying$(false);
    this.EmbedController.pause();
  }

  resumeYoutubePlayer(
    emitToServer: boolean,
    guildID: string,
    time?: number
  ): void {
    if (emitToServer) {
      this.socket?.emit('resume', {
        guildID: guildID,
        resume: 'resume',
        time: this.player.getCurrentTime(),
      });
      console.log('Emiting resume event: ', true);
    }

    if (time) {
      this.player.seekTo(time);
    }
    this.guildContentService.updatePlaying$(true);
    this.player.playVideo();
    return;
  }

  resumeSpotifyPlayer(emitToServer: boolean, guildID: string): void {
    if (emitToServer)
      this.socket?.emit('resume', {
        guildID: guildID,
        resume: 'resume',
        time: null,
      });
    console.log('Emiting resume event spotify: ', false);
    this.guildContentService.updatePlaying$(true);
    this.EmbedController.resume();
  }

  skipTrack(guildID: string) {
    this.http
      .post(`${environment.API_ENDPOINT}/discord/skip-track`, {
        guildID: guildID,
      })
      .subscribe((res) => {
        console.log(res);
      });
  }

  backTrack(guildID: string) {
    this.http
      .post(`${environment.API_ENDPOINT}/discord/skip-back`, {
        guildID: guildID,
      })
      .subscribe((res) => {
        console.log(res);
      });
  }

  shuffle(guildID: string) {
    this.http
      .post(`${environment.API_ENDPOINT}/discord/shuffle`, {
        guildID: guildID,
      })
      .subscribe((res) => {
        console.log(res);
      });
  }

  loop(guildID: string, repeatMode: RepeatMode) {
    this.socket?.emit('repeatMode', {guildID: guildID, repeatMode: repeatMode})
    // this.http
    //   .post(`${environment.API_ENDPOINT}/discord/loop`, {
    //     guildID,
    //     repeatMode: repeatMode,
    //   })
    //   .subscribe((res: any) => {
    //     console.log(res.repeatMode);
    //     this.guildContentService.updateRepeatMode$(res.repeatMode);
    //   });
  }

  togglePlay(guildID: string) {
    const isSpotify = this.source === 'spotify';
    console.log('To playing???', this.playing)
    if (this.playing) {
      isSpotify
        ? this.pauseSpotifyPlayer(true, guildID)
        : this.pauseYoutubePlayer(true, guildID);
    } else {
      isSpotify
        ? this.resumeSpotifyPlayer(true, guildID)
        : this.resumeYoutubePlayer(true, guildID);
    }
  }

  setupListener(guildID: string): void {
    if (!this.socket || !guildID) return;

    this.socket.off(`playerPause:${guildID}`);
    this.socket.off(`playerResume:${guildID}`);
    this.socket.off(`repeatMode:${guildID}`);

    const playerActions = {
      spotify: {
        pause: () => this.pauseSpotifyPlayer(false, guildID),
        resume: (time: number) => this.resumeSpotifyPlayer(false, guildID),
        seek: (time: number) => this.EmbedController.seek(time),
      },
      youtube: {
        pause: () => this.pauseYoutubePlayer(false, guildID),
        resume: (time: number) =>
          this.resumeYoutubePlayer(false, guildID, time),
        seek: (time: number) => this.player.seekTo(time),
      },
    };

    this.socket.on(`repeatMode:${guildID}`, (data : any) => {
      this.guildContentService.updateRepeatMode$(data.repeatMode)
    });

    this.socket.on(`playerResume:${guildID}`, (data: any) => {
      this.updateSuppressStateChange$(true)
      this.updateSynchronizing$(true);
      const source = this.current.track.info.sourceName as 'spotify' | 'youtube';
      console.log('Received resume event from server.', data);

      playerActions[source]?.['resume']?.(data.time);
    });

    this.socket.on(`playerPause:${guildID}`, (data: any) => {
      this.updateSynchronizing$(true);
      const source = this.current.track.info.sourceName as 'spotify' | 'youtube';
      console.log('Received pause event from server.', source);

      playerActions[source]?.['pause']?.();
    });
  }

  emitSpotifyCurrentTime(guildID: string, time: number) {
    this.socket?.emit('resume', {
      guildID: guildID,
      resume: 'resume',
      time: time / 1000,
    });
  }

  createTimeInterval() {
    if (this.intervalID) return;
    const updateInterval = 150;
    console.log('Criando time interval');
    this.intervalID = setInterval(() => {
      this.updatePlaybackPosition$(this.player.getCurrentTime() * 1000);
    }, updateInterval);
  }

  resetTimeInterval() {
    this.destroyTimeInterval();
    this.createTimeInterval();
  }

  destroyTimeInterval() {
    console.log('Destrui time interval!');
    clearInterval(this.intervalID);
    this.intervalID = null;
  }

  getPlayerTime(guildID: string): Observable<any> {
    return this.http
      .get(`${environment.API_ENDPOINT}/discord/player/time?guildID=${guildID}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching time data:', error.message);
          return throwError(() => new Error('Failed to fetch time data.'));
        })
      );
  }
}
