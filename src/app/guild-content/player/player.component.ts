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

  // ADICIONAR O PLAYER A UM SUBJECT
  private socketSub!: Subscription;
  constructor(
    private httpService: HttpClient,
    private playerService: PlayerService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef
  ) {
    this.socketSub = this.socketService.getSocket$().subscribe({
      next: (socket) => {
        this.socket = socket;
        console.log('TO NEM ENTRANDO AQUI?????', socket);
      },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['url'] && changes['url'].currentValue) {
      const newVideoId = this.extractVideoId(this.url);
      if (newVideoId !== this.videoId) {
        this.videoId = newVideoId;
        this.updatePlayer();

        this.setupListener(this.guildID);
      }
    }
  }

  ngAfterViewInit(): void {
    if ((window as any).YT && (window as any).YT.Player) {
      this.initializePlayer();
    } else {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
      (window as any).onYouTubeIframeAPIReady = () => {
        this.initializePlayer();
        this.playerService.setPlayerInstance(this.player);
      };
    }
    window.addEventListener('resize', this.onWindowResize.bind(this));

    this.cdr.detectChanges();
  }

  private async initializePlayer(): Promise<void> {
    if (!this.url) return;
    console.log('QUE TEMPO RECEBIIII? ', this.time);
    this.videoId = this.extractVideoId(this.url);

    const { width, height } = await this.getPlayerDimensionsAfterDelay(10);

    this.player = new YT.Player('youtube-player', {
      height: height,
      width: width,
      videoId: this.videoId,
      playerVars: {
        autoplay: this.paused ? 0 : 1,
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

  private getPlayerDimensionsAfterDelay(delay: number): Promise<{ width: number, height: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const playerContainer = document.querySelector('.player');
      const width = playerContainer?.clientWidth || 1600;
      const height = playerContainer?.clientHeight || 900;
      console.log(playerContainer?.clientHeight);
      console.log(width, height);
      resolve({ width, height });
    }, delay);
  });
}

  private updatePlayer(): void {
    if (this.player && this.videoId) {
      this.player.loadVideoById(this.videoId);
      setTimeout(() => {
        this.player.seekTo(this.time / 1000, true);
        console.log('Seeking to:', this.time);
      }, 500);
    }
  }

  private extractVideoId(url: string): string {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
  }

  private onPlayerReady(event: any, startTime: number): void {
    console.log('YouTube Player is ready');
    if (startTime > 0) {
      event.target.seekTo(startTime, true);
    }
    event.target.playVideo();
  }

  onPlayerStateChange(event: any): void {
    // if (this.player.isMuted()) return;
    if (event.data === YT.PlayerState.PAUSED) {
      this.pausePlayer();
    }
    console.log(this.guildID);
    if (event.data === YT.PlayerState.PLAYING) {
      this.resumePlayer();
    }
  }

  private onWindowResize(): void {
    const playerContainer = document.querySelector('.player');
    const newWidth = playerContainer?.clientWidth || 1600;
    const newHeight = playerContainer?.clientHeight || 900;

    if (this.player) {
      this.player.setSize(newWidth, newHeight);
      console.log('resize to: ', newWidth, newHeight);
    }
  }

  pausePlayer() {
    this.socket?.off('pause');
    this.socket?.emit('pause', { guildID: this.guildID, pause: true });
  }

  resumePlayer() {
    this.socket?.off('pause');
    this.socket?.emit('pause', { guildID: this.guildID, pause: false });
  }

  private setupListener(guildID: string): void {
    if (!this.socket || !guildID) return;

    this.socket.off(`playerPause:${guildID}`);

    this.socket.on(`playerPause:${guildID}`, (data: any) => {
      console.log('Recebi o evento de pausa:', data);
      if (data.pause) {
        this.pausePlayer();
      } else {
        this.resumePlayer();
      }
    });
  }

  private eventHandlerPause(data: any): void {
    if (this.player && this.player.getPlayerState) {
      if (data) {
        this.player.pauseVideo();
      } else {
        this.player.playVideo();
      }
    } else {
      console.warn('YouTube Player is not ready yet.');
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

  ngOnDestroy() {
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    console.log('FUI DESTRUIDO??? PLAYER');
  }
}
