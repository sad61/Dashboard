import { HttpClient } from '@angular/common/http';
import {
  Component,
  AfterViewInit,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { environment } from '../../../environment';
import { Subscription } from 'rxjs';
import { PlayerService } from './services/player.service';
import { SocketService } from '../../main-frame/services/socket.service';
import { Socket } from 'socket.io-client';
import { CommonModule } from '@angular/common';

declare var YT: any;

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent implements AfterViewInit, OnChanges {
  @Input() url!: string;
  @Input() guildID!: string;
  @Input() time!: number;
  @Input() paused!: boolean;
  @Input() source!: string;
  private player: any;
  private videoId: string = '';
  private socket!: Socket<any, any> | null;

  private firstInitialized!: any;
  private suppressStateChange = false;
  private suppressSeek = false;
  private spotifyAlreadyInitialized: boolean = false;

  private previousSource!: string;

  // ADICIONAR O PLAYER A UM SUBJECT
  private socketSub!: Subscription;

  private spotifyController: any;
  private spotifyIframeAPI: any;

  spotifySelected!: boolean;
  youtubeSelected!: boolean;

  constructor(
    private httpService: HttpClient,
    private playerService: PlayerService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef
  ) {
    this.socketSub = this.socketService.getSocket$().subscribe({
      next: (socket) => {
        this.socket = socket;
      },
    });
  }

  private stateDueToInit: boolean = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['url']) {
      if (this.previousSource === this.source) {
        this.updatePlayerContent();
      } else {
        this.reinitializePlayer();
      }
    }
  }

  private updatePlayerContent(): void {
    switch (this.source) {
      case 'youtube':
        this.loadYouTubeContent();
        break;
      case 'spotify':
        this.loadSpotifyContent();
        break;
    }
  }

  private reinitializePlayer(): void {
    this.destroyPreviousPlayer();
    this.initializePlayer();
    this.previousSource = this.source;
    this.cdr.detectChanges();
  }

  private loadYouTubeContent(): void {
    const videoId = this.extractVideoId(this.url);
    this.player.loadVideoById(videoId);
    this.player.playVideo();
  }

  public changeView() {
    this.player.seekTo(30)
  }

  private loadSpotifyContent(): void {
    const uri = this.convertUrlToUri(this.url);
    if (uri) {
      this.spotifyController.loadUri(uri);
      this.spotifyController.togglePlay();
    }
  }

  private initializePlayer(): void {
    switch (this.source) {
      case 'youtube':
        this.loadYouTubePlayer();
        this.youtubeSelected = true;
        this.spotifySelected = false;
        break;
      case 'spotify':
        const uri = this.convertUrlToUri(this.url);

        this.loadSpotifyPlayer(uri);
        this.spotifySelected = true;
        this.youtubeSelected = false;

        break;
    }
  }

  ngOnDestroy(): void {
    this.destroyPreviousPlayer();
  }

  private destroyPreviousPlayer(): void {
    if (this.previousSource === 'spotify' && this.spotifyController) {
      this.spotifyController.destroy();
      const existingSpotifyScript = document.getElementById(
        'spotify-iframe-api'
      );
      if (existingSpotifyScript) {
        existingSpotifyScript.remove();
      }
    } else if (this.previousSource === 'youtube' && this.player) {
      this.player.destroy();
      this.player = null;
    }
  }

  ngAfterViewInit(): void {
    this.previousSource = this.source;
    this.initializePlayer();
    this.setupListener(this.guildID);
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private loadYouTubePlayer(): void {
    if ((window as any).YT && (window as any).YT.Player) {
      this.initializeYoutubePlayer();
    } else {
      this.addYouTubeScript();
    }
  }

  private addYouTubeScript(): void {
    const existingYoutubeScript = document.getElementById('youtube-iframe-api');
    if (!existingYoutubeScript) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
    (window as any).onYouTubeIframeAPIReady = () => {
      this.initializeYoutubePlayer();
      this.playerService.setPlayerInstance(this.player);
    };
  }

  private loadSpotifyPlayer(uri: string): void {
    if ((window as any).SpotifyIframe) {
      this.initializeSpotifyPlayer(uri, (window as any).SpotifyIframe);
      return;
    }

    const existingScript = document.getElementById('spotify-iframe-api');
    if (!existingScript) {
      this.addSpotifyScript(uri);
    }
  }

  private addSpotifyScript(uri: string): void {
    const tag = document.createElement('script');
    tag.id = 'spotify-iframe-api';
    tag.src = 'https://open.spotify.com/embed/iframe-api/v1';
    document.body.appendChild(tag);
    if ((window as any).SpotifyIframe) {
      this.initializeSpotifyPlayer(uri, (window as any).SpotifyIframe);
      return;
    }
    if (this.spotifyAlreadyInitialized) {
      this.initializeSpotifyPlayer(uri, this.spotifyIframeAPI);
      return;
    }
    (window as any).onSpotifyIframeApiReady = (IFrameAPI: any) => {
      this.initializeSpotifyPlayer(uri, IFrameAPI);
      this.spotifyIframeAPI = IFrameAPI;
      this.spotifyAlreadyInitialized = true;
    };
  }

  private initializeSpotifyPlayer(uri: string, IFrameAPI?: any): void {
    this.cdr.detectChanges();
    const element = document.getElementById('spotify-player');
    if (!element) {
      console.error('Spotify player element not found');
      return;
    }

    const API = IFrameAPI;

    const playerContainer = document.querySelector('.player');
    const width = playerContainer?.clientWidth || 1600;
    const height = playerContainer?.clientHeight || 900;
    const options = {
      uri: uri,
      width: width,
      height: height,
    };

    API.createController(element, options, (EmbedController: any) => {
      this.spotifyController = EmbedController;
      if (!this.paused) this.spotifyController.play();
    });
  }

  private async initializeYoutubePlayer(): Promise<void> {
    if (!this.url) return;
    this.videoId = this.extractVideoId(this.url);

    const { width, height } = await this.getPlayerDimensionsAfterDelay(10);
    console.log('Initializing youtube player');
    this.player = new YT.Player('youtube-player', {
      height: height,
      width: width,
      videoId: this.videoId,
      playerVars: {
        autoplay: 1,
        controls: 1,
        rel: 0,
        modestbranding: 1,
        enablejsapi: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: (event: any) => this.onPlayerReady(event, this.time / 1000),
        onStateChange: this.onPlayerStateChange.bind(this),
      },
    });
  }

  private getPlayerDimensionsAfterDelay(
    delay: number
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const playerContainer = document.querySelector('.player');
        const width = playerContainer?.clientWidth || 1600;
        const height = playerContainer?.clientHeight || 900;
        resolve({ width, height });
      }, delay);
    });
  }

  private updateYoutubePlayer(videoID: string): void {
    if (this.player) {
      this.player.loadVideoById(videoID);
      setTimeout(() => {
        this.player.seekTo(this.time / 1000, true);
      }, 500);
    }
  }

  private extractVideoId(url: string): string {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
  }

  private convertUrlToUri(url: string): string {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const type = pathParts[1];
    const id = pathParts[2];
    return `spotify:${type}:${id}`;
  }

  private onPlayerReady(event: any, startTime: number): void {
    if (startTime > 0) {
      event.target.seekTo(startTime, true);
    }
    console.log('Calling to play?');
    this.player.playVideo();
  }

  onPlayerStateChange(event: any): void {
    if (event.data === YT.PlayerState.BUFFERING) {
      return;
    }

    if (event.data === -1) return;

    if (this.suppressStateChange) {
      this.suppressStateChange = false;
      return
    }

    if (this.stateDueToInit) {
      this.stateDueToInit = false;
      return;
    }

    if (this.suppressSeek) {
      this.suppressSeek = false;
      return;
    }

    if (event.data === YT.PlayerState.PAUSED && !this.player.isMuted()) {
      console.log('Inside state change and pausing.');
      this.pauseYoutubePlayer(true);
    }

    if (event.data === YT.PlayerState.PLAYING) {
      console.log('Supress seek: ', this.suppressSeek)
      console.log('Inside state change and resuming.');
      this.resumeYoutubePlayer(true);
    }
  }

  private onWindowResize(): void {
    const playerContainer = document.querySelector('.player');
    const newWidth = playerContainer?.clientWidth || 1600;
    const newHeight = playerContainer?.clientHeight || 900;

    if (this.player) {
      this.player.setSize(newWidth, newHeight);
    }
  }

  pauseYoutubePlayer(emitToServer: boolean): void {
    if (emitToServer) {
      this.socket?.emit('pause', { guildID: this.guildID, pause: true });
      console.log('Emiting pause event: ', true);
    }

    this.player.pauseVideo();
  }

  pauseSpotifyPlayer(emitToServer: boolean): void {
    if (emitToServer) {
      this.socket?.emit('pause', { guildID: this.guildID, pause: true });
      console.log('Emiting pause event: ', true);
    }

    this.spotifyController.pause();
  }

  resumeYoutubePlayer(emitToServer: boolean, time?: number): void {
    if (emitToServer) {
      this.socket?.emit('resume', { guildID: this.guildID, resume: false, time: this.player.getCurrentTime()});
      console.log('Emiting resume event: ', true);
    }

    if (time) {
      this.player.seekTo(time)
    }
    this.player.playVideo();
    return;
  }

  resumeSpotifyPlayer(emitToServer: boolean): void {
    if (emitToServer)
      this.socket?.emit('pause', { guildID: this.guildID, pause: false });
    console.log('Emiting pause event: ', false);
    this.spotifyController.resume();
  }

  private setupListener(guildID: string): void {
    if (!this.socket || !guildID) return;

    this.socket.off(`playerPause:${guildID}`);
    this.socket.off(`playerResume:${guildID}`);

    const playerActions = {
      spotify: {
        pause: () => this.pauseSpotifyPlayer(false),
        resume: (time: number) => this.resumeSpotifyPlayer(false),
        seek: (time: number) => this.spotifyController.seek(time),
      },
      youtube: {
        pause: () => this.pauseYoutubePlayer(false),
        resume: (time: number) => this.resumeYoutubePlayer(false, time),
        seek: (time: number) => this.player.seekTo(time),
      },
    };

    // this.socket.on(`playerSeek:${guildID}`, (data: any) => {
    //   const source = this.source as 'spotify' | 'youtube';
    //   this.suppressSeek = true;
    //   console.log('Received seek event from server.');
    //   playerActions[source]?.['seek']?.(data.time);
    // });


    this.socket.on(`playerResume:${guildID}`, (data: any) => {
      this.suppressStateChange = true; 
      const source = this.source as 'spotify' | 'youtube';
      console.log('Received resume event from server.', data);

      playerActions[source]?.['resume']?.(data.time);
    })

    this.socket.on(`playerPause:${guildID}`, (data: any) => {
      this.suppressStateChange = true;
      const source = this.source as 'spotify' | 'youtube';
      console.log('Received pause event from server.');
      playerActions[source]?.['pause']?.();
    });
  }

  playVideo(): void {
    this.player?.playVideo();
  }

  pauseVideo(): void {
    this.player?.pauseVideo();
  }

  stopVideo(): void {
    this.player?.stopVideo();
  }
}
