import {
  HttpClient,
  HttpClientModule,
  HttpErrorResponse,
} from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { BehaviorSubject, catchError, throwError } from 'rxjs';
import { GuildIconComponent } from './guild-icon/guild-icon.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { environment } from '../../environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-guild-nav',
  standalone: true,
  imports: [GuildIconComponent, MatSidenavModule, CommonModule],
  templateUrl: './guild-nav.component.html',
  styleUrl: './guild-nav.component.scss',
})
export class GuildNavComponent {
  @Input() guilds: Map<string, any> | undefined;
  ngOnInit() {
    console.log(this.guilds)
  }
}
