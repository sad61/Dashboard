import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription, catchError, fromEvent, throwError } from 'rxjs';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { SocketService } from './services/socket.service';
import { Socket } from 'socket.io-client';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ButtonsComponent } from '../buttons/buttons.component';
import { GuildNavComponent } from '../guild-nav/guild-nav.component';
import { GuildContentComponent } from '../guild-content/guild-content.component';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  ActivatedRoute,
} from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environment';
import { GeneralService } from '../general.service';
import { FooterComponent } from './footer/footer.component';
@Component({
  selector: 'app-main-frame',
  standalone: true,
  imports: [
    MatSidenavModule,
    GuildNavComponent,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    FooterComponent,
    ButtonsComponent,
    GuildContentComponent,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './main-frame.component.html',
  styleUrl: './main-frame.component.scss',
})
export class MainFrameComponent {
  protected guilds: any;

  private guildsSub: Subscription;

  constructor(
    private route: ActivatedRoute,
    private httpService: HttpClient,
    private generalService: GeneralService
  ) {
    const id = route.snapshot.paramMap.get('id');

    this.guildsSub = this.generalService.guilds$.subscribe({
      next: (guilds) => {
        this.guilds = guilds;
        console.log(guilds);
      },
    });
    console.log('guildaaaaaaaaaaas', this.guilds);
  }
}
