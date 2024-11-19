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
  @Input() tracks!: any[];
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

  }


  drop(event: CdkDragDrop<string[]>) {
    console.log(event.previousIndex, event.currentIndex)
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      // this.guildContentService.moveTrack(event.previousIndex, event.currentIndex)
      this.socket?.emit('move', {guildID: this.guildID, position: {from: event.previousIndex, to: event.currentIndex}})
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

}
