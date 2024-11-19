import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environment';
import { GuildContentService } from '../../services/guild-content.service';
import { SocketService } from '../../../main-frame/services/socket.service';
import { Subscription, tap } from 'rxjs';
import { Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private socket!: Socket<any, any> | null;
  private youTubePlayer: any;



  private socketSub!: Subscription;
  constructor(
    private httpServie: HttpClient,
    private guildContentService: GuildContentService,
    private socketService: SocketService
  ) {
  }

  public setPlayerInstance(player: any): void {
    this.youTubePlayer = player;
  }
}
