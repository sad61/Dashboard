import { CommonModule } from '@angular/common';
import { Component, HostListener, Input } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import {
  ActivatedRoute,
  RouterLink,
  RouterLinkActive,
  RouterModule,
  RouterOutlet,
} from '@angular/router';
import { GuildService } from '../../guild/guild.service';
import { Guild } from '../../interfaces/interface';
import { ParamsService } from '../../main-frame/services/params.service';

@Component({
  selector: 'app-guild-icon',
  standalone: true,
  imports: [
    CommonModule,
    MatTooltipModule,
    MatRippleModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './guild-icon.component.html',
  styleUrl: './guild-icon.component.scss',
})
export class GuildIconComponent {
  @Input() iconURL!: string;
  @Input() guild!: Guild;

  protected routeID!: string | null;
  protected _guild!: Guild;
  selectedGuild: string = '';

  guildSub: Subscription;

  constructor(
    private paramsService: ParamsService,
    private guildService: GuildService
  ) {
    this.guildSub = this.guildService.getGuild$().subscribe({
      next: (guild: Guild) => {
        this._guild = guild;
      },
    });
  }

  checkSelectedGuild() {
    if (this.guild.id === this.paramsService.routeName) this.updateGuild();
  }

  updateGuild() {
    this.guildService.setNextGuild$(this.guild);
  }

  ngAfterInit() {
    console.log(this.iconURL, this.guild?.name);
  }

  ngOnInit(): void {
    if (this.paramsService.routeID === this.guild.id) {
      console.log('match found, updating guild');
      this.guildService.setNextGuild$(this.guild);
    }

    this.setButtonSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.setButtonSize();
  }

  setButtonSize(): void {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const factor = 0.1;

    const size = Math.min(screenWidth, screenHeight) * factor;
    document.documentElement.style.setProperty('--size', `${size}px`);
  }
}
