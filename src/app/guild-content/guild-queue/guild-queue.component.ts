import { Component, Input } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDrag,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { GuildContentService } from '../services/guild-content.service';
import { Subscription } from 'rxjs';
import { SocketService } from '../../main-frame/services/socket.service';
import { Socket } from 'socket.io-client';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-guild-queue',
  standalone: true,
  imports: [CommonModule, CdkDropList, CdkDrag],
  templateUrl: './guild-queue.component.html',
  styleUrl: './guild-queue.component.scss',
})
export class GuildQueueComponent {
  @Input() tracks!: any[] | undefined;
  @Input() guildID!: any;
  private socket!: Socket<any, any> | null;


  socketSub: Subscription;
  constructor(private guildContentService: GuildContentService, private socketService: SocketService) {
     this.socketSub = this.socketService.getSocket$().subscribe({
      next: (socket) => {
        this.socket = socket;
        console.log('TO NEM ENTRANDO AQUI?????', socket);
      },
    });
    console.log('recebendo essa tracks ', this.tracks)

  }

  author(track: any) {
    console.log(track.info.author)
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) return;
    this.socket?.emit('move', {guildID: this.guildID, position: {from: event.previousIndex, to: event.currentIndex}})
     moveItemInArray(this.tracks as any, event.previousIndex, event.currentIndex);
  }
}
