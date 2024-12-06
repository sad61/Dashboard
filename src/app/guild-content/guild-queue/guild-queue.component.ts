import { Component, Input } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDrag,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { GuildContentService } from '../services/guild-content.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { SocketService } from '../../main-frame/services/socket.service';
import { Socket } from 'socket.io-client';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { PlayerService } from '../player/services/player.service';
import { TrackContainerComponent } from './track-container/track-container.component';
@Component({
  selector: 'app-guild-queue',
  standalone: true,
  imports: [
    CommonModule,
    CdkDropList,
    CdkDrag,
    MatDividerModule,
    TrackContainerComponent,
  ],
  templateUrl: './guild-queue.component.html',
  styleUrl: './guild-queue.component.scss',
})
export class GuildQueueComponent {
  @Input() tracks!: any[] | undefined;
  @Input() previousTrack!: any;
  @Input() guildID!: any;
  private socket!: Socket<any, any> | null;

  private destroy$ = new Subject<void>();

  socketSub: Subscription;
  constructor(
    private guildContentService: GuildContentService,
    private socketService: SocketService,
    private playerService: PlayerService
  ) {
    this.socketSub = this.socketService.getSocket$().subscribe({
      next: (socket) => {
        this.socket = socket;
        console.log('TO NEM ENTRANDO AQUI?????', socket);
      },
    });
  }

  ngAfterViewInit() {
    console.log('Guild id?: ', this.guildID);
    this.setupListeners();
  }

  author(track: any) {
    console.log(track.info.author);
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) return;
    this.socket?.emit('move', {
      guildID: this.guildID,
      position: { from: event.previousIndex, to: event.currentIndex },
    });
    moveItemInArray(
      this.tracks as any,
      event.previousIndex,
      event.currentIndex
    );
  }

  playTrack(i: number) {
    this.guildContentService.playTrack(i);
  }

  playPrevious() {
    console.log('PlayPrevious??')
    this.guildContentService.playPreviousTrack();
  }

  setupListeners() {
    this.socket?.off(`move:${this.guildID}`);
    this.socket?.on(`move:${this.guildID}`, (data: any) => {
      console.log('Received update on tracks: ', data.tracks);
      this.guildContentService.updateTracks(data.tracks);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
