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
import { Subscription, takeUntil } from 'rxjs';
import { SocketService } from '../../main-frame/services/socket.service';
import { Socket } from 'socket.io-client';
import { CommonModule } from '@angular/common';
import { PlayerService } from './services/player.service';
import { GeneralService } from '../../general.service';
import { PlayerInfoComponent } from './player-info/player-info.component';
import { GuildContentService } from '../services/guild-content.service';

declare var YT: any;

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, PlayerInfoComponent],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})

// FOCUS WINDOW
export class PlayerComponent implements AfterViewInit, OnChanges {
  @Input() current!: any;
  @Input() guildID!: string;
  private player: any;
  private videoId: string = '';

  private firstInitialized!: any;
  private suppressStateChange!: boolean;
  private suppressSeek = false;

  private previousSource!: string;

  private socketSub!: Subscription;

  private spotifyController: any;

  private spotifyPaused: boolean = false;
  private spotifyPosition!: number;

  spotifySelected!: boolean;
  youtubeSelected!: boolean;

  private IFrame!: any;

  private synchronizing!: boolean;

  constructor(
    private httpService: HttpClient,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef,
    private playerService: PlayerService,
    private generalService: GeneralService,
    private guildContentService: GuildContentService
  ) {
    this.playerService.getIFrame$().subscribe((iframe) => {
      this.IFrame = iframe;
    });

    this.playerService.getSynchronizing$().subscribe((synch) => {
      this.synchronizing = synch;
    });

    this.playerService.getSuppressStateChange().subscribe((suppress) => {
      this.suppressStateChange = suppress
    })
  }

  private stateDueToInit: boolean = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['current']) {
      if (this.previousSource === this.current?.track?.info?.sourceName) {
        this.updatePlayerContent();
      } else {
        this.reinitializePlayer();
      }
    }
  }

  private updatePlayerContent(): void {
    switch (this.current?.track?.info?.sourceName) {
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
    this.previousSource = this.current.track.info.sourceName;
    this.playerService.updateSource$(this.previousSource);
    this.cdr.detectChanges();
  }

  private loadYouTubeContent(): void {
    const videoId = this.extractVideoId(this.current.track.info.uri);
    this.player.loadVideoById(videoId);
    this.player.playVideo();
  }

  public changeView() {
    this.spotifyController.seek(30);
  }

  private loadSpotifyContent(): void {
    const uri = this.convertUrlToUri(this.current.track.info.uri);
    if (uri) {
      this.spotifyController.loadUri(uri);
      this.spotifyController.togglePlay();
    }
  }

  private initializePlayer(): void {
    switch (this.current?.track?.info?.sourceName) {
      case 'youtube':
        this.playerService.updateSource$(this.current.track.info.sourceName);
        this.loadYouTubePlayer();
        this.youtubeSelected = true;
        this.spotifySelected = false;
        break;
      case 'spotify':
        this.playerService.updateSource$(this.current.track.info.sourceName);
        const uri = this.convertUrlToUri(this.current.track.info.uri);
        this.loadSpotifyPlayer(uri);
        this.spotifySelected = true;
        this.youtubeSelected = false;

        break;
    }
  }

  ngOnDestroy(): void {
    console.log('Destroying player onDestroy');
    this.guildContentService.updatePlaying$(false);
    this.destroyPreviousPlayer(true);
  }

  private destroyPreviousPlayer(force?: boolean): void {
    console.log('Destroying player');
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
      this.playerService.destroyTimeInterval();
      this.player = null;
    }
    this.playerService.updateSource$(null);
  }

  ngAfterViewInit(): void {
    console.log('uaiiii so');
    this.previousSource = this.current?.track?.info?.sourceName;
    this.initializePlayer();
    this.playerService.setupListener(this.guildID);
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
    if (this.IFrame) {
      this.initializeSpotifyPlayer(uri, this.IFrame);
      return;
    }
    (window as any).onSpotifyIframeApiReady = (IFrameAPI: any) => {
      this.initializeSpotifyPlayer(uri, IFrameAPI);
      this.playerService.updateIFrame$(IFrameAPI);
    };
  }

  private async initializeSpotifyPlayer(
    uri: string,
    IFrameAPI?: any
  ): Promise<void> {
    this.cdr.detectChanges();
    const element = document.getElementById('spotify-player');
    if (!element) {
      console.error('Spotify player element not found');
      return;
    }

    const API = IFrameAPI;

    const playerContainer = document.querySelector('.spotify-div');
    const width = playerContainer?.clientWidth || 1600;
    const height = playerContainer?.clientHeight || 900;
    const options = {
      uri: uri,
      width: width,
      height: height,
    };

    API.createController(element, options, (EmbedController: any) => {
      this.spotifyController = EmbedController;
      this.playerService.updateEmbedController$(EmbedController);

      EmbedController.addListener('ready', async () => {
        const delay = (ms: number) =>
          new Promise((resolve) => setTimeout(resolve, ms));

        await delay(3000);
        if (this.current.paused) await this.spotifyController.pause();
        if (this.current.time)
          await this.spotifyController.seek(this.current.time / 1000);
      });

      EmbedController.addListener('playback_update', (e: any) => {
        this.playerService.updatePlaybackPosition$(e.data.position);
        if (e.data.isPaused) {
          this.playerService.pauseSpotifyPlayer(true, this.guildID);
          this.spotifyPaused = true;
        }

        if (this.spotifyPaused && !e.data.isPaused) {
          this.playerService.resumeSpotifyPlayer(true, this.guildID);
          this.spotifyPaused = false;
        }

        // console.log(this.spotifyPosition, e.data.position)
        // console.log(Math.abs(e.data.position - this.spotifyPosition) > 400, ' should i emit resume?')
        if (Math.abs(e.data.position - this.spotifyPosition) > 400) {
          this.playerService.emitSpotifyCurrentTime(
            this.guildID,
            e.data.position
          );
        }
        this.spotifyPosition = e.data.position;
      });
      // if (!this.current.paused) this.spotifyController.play();
    });
  }

  private async initializeYoutubePlayer(): Promise<void> {
    if (!this.current.track.info.uri) return;
    this.videoId = this.extractVideoId(this.current.track.info.uri);

    const { width, height } = await this.getPlayerDimensionsAfterDelay(10);
    console.log('Initializing youtube player');
    this.player = new YT.Player('youtube-player', {
      height: height,
      width: width,
      videoId: this.videoId,
      playerVars: {
        autoplay: this.current.paused ? 0 : 1,
        controls: 1,
        rel: 0,
        modestbranding: 1,
        enablejsapi: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: (event: any) =>
          this.onPlayerReady(event, this.current.time / 1000),
        onStateChange: this.onPlayerStateChange.bind(this),
      },
    });
    this.playerService.updatePlayer$(this.player);
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
        this.player.seekTo(this.current?.time / 1000, false);
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

    this.playerService.createTimeInterval();
  }

  onPlayerStateChange(event: any): void {
    // console.log(event.data)
    if (event.data === -1) {
      this.player.playVideo()
      return;
    }

    if (this.suppressStateChange) {
      this.playerService.updateSuppressStateChange$(false)
      return;
    }

    if (this.synchronizing) {
      this.playerService.updateSynchronizing$(false);
      return;
    }

    if (this.stateDueToInit) {
      if (event.data === YT.PlayerState.PLAYING && this.current?.paused)
        this.player.pauseVideo();
      this.stateDueToInit = false;
      return;
    }

    if (event.data === YT.PlayerState.PAUSED && !this.player.isMuted()) {
      this.playerService.destroyTimeInterval();
      console.log('Inside state change and pausing.');
      this.playerService.pauseYoutubePlayer(true, this.guildID);
    }

    if (event.data === YT.PlayerState.PLAYING && !this.player.isMuted()) {
      this.playerService.createTimeInterval();
      console.log('Inside state change and resuming.');
      this.playerService.resumeYoutubePlayer(true, this.guildID);
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
