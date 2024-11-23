import { ChangeDetectorRef, Component } from '@angular/core';
import { ButtonsComponent } from '../buttons/buttons.component';
import { MatButtonModule } from '@angular/material/button';
import {
  ActivatedRoute,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { Observable, Subscription, switchMap, map } from 'rxjs';
import { Guild } from '../interfaces/interface';
import { GuildContentService } from './services/guild-content.service';
import { PlayerComponent } from './player/player.component';
import { GeneralService } from '../general.service';
import { CommonModule } from '@angular/common';
import { GuildQueueComponent } from './guild-queue/guild-queue.component';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { SocketService } from '../main-frame/services/socket.service';
import { Socket } from 'socket.io-client';

@Component({
  selector: 'app-guild-content',
  standalone: true,
  imports: [
    CommonModule,
    ButtonsComponent,
    PlayerComponent,
    GuildQueueComponent,
    MatButtonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: './guild-content.component.html',
  styleUrl: './guild-content.component.scss',
})
export class GuildContentComponent {
  current: any | undefined;
  tracks: any[] | undefined;
  protected _guild: Guild = { id: '', name: '' };
  private subscriptions: Subscription[] = [];
  protected _time: number = 0;
  protected guild: any | undefined = '';
  guild$: Observable<Guild | undefined>;
  current$: Observable<any | undefined>;

  private socket!: Socket<any, any> | null;

  socketSub: Subscription;


  constructor(
    private route: ActivatedRoute,
    private generalService: GeneralService,
    private guildContentService: GuildContentService,
    private cdr: ChangeDetectorRef,
    private socketService: SocketService
  ) {
    this.socketSub = this.socketService.getSocket$().subscribe({
      next: (socket) => {
        this.socket = socket;
        console.log('TO NEM ENTRANDO AQUI?????', socket);
      },
    });
    this.guild$ = this.route.paramMap.pipe(
      switchMap((params) => {
        const guildId = params.get('id');
        return this.generalService.guilds$.pipe(
          map((guildMap) => guildMap.get(guildId!))
        );
      })
    );

    this.current$ = this.generalService.guilds$.pipe(
      switchMap(() => this.guildContentService.getCurrent$())
    );


    console.log('this.tracks ', this.tracks);
  }

  ngAfterViewInit(): void {
    this.subscriptions.push(
      this.route.params.subscribe((params) => {
        this.guildContentService.initializeSocketConnection(params).subscribe();
      })
    );

    this.subscriptions.push(
      this.guildContentService.getCurrent$().subscribe((newCurrent) => {
        this.current = newCurrent;
      })
    );
    this.subscriptions.push(
      this.guildContentService.getTracks$().subscribe((newTracks) => {
        this.tracks = newTracks;
      })
    );

    // this.subscriptions.push(
    //   this.guildContentService.getTime$().subscribe((newTime) => {
    //     console.log('recebi novo tempo: ', newTime);
    //     this._time = newTime;
    //   })
    // );
  }

  drop(event: CdkDragDrop<string[]>) {
    console.log(event.previousIndex, event.currentIndex);
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      // this.guildContentService.moveTrack(event.previousIndex, event.currentIndex)
      this.socket?.emit('move', {
        guildID: this._guild.id,
        position: { from: event.previousIndex, to: event.currentIndex },
      });
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  ngOnDestroy(): void {
    console.log('Component Destroyed');

    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
