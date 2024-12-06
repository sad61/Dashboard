import { ChangeDetectorRef, Component } from '@angular/core';
import { TrackContainerComponent } from '../../guild-content/guild-queue/track-container/track-container.component';
import { GeneralService } from '../../general.service';
import { GuildContentService, RepeatMode } from '../../guild-content/services/guild-content.service';
import { map, switchMap, throttleTime } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatSliderModule } from '@angular/material/slider';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { PlayerService} from '../../guild-content/player/services/player.service';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule, TooltipPosition } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';




@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    TrackContainerComponent,
    CommonModule,
    MatSliderModule,
    MatInputModule,
    FormsModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  current: any = null;
  maxPosition: number = 0;
  position: number = 0;

  showDelay: number = 200;
  showPosition: TooltipPosition = 'above';

  repeatMode!: RepeatMode;
  playing!: boolean;

  private guildID!: string;

  constructor(
    private generalService: GeneralService,
    private route: ActivatedRoute,
    private guildContentService: GuildContentService,
    private playerService: PlayerService,
    private cdr: ChangeDetectorRef
  ) {
    this.guildContentService.getCurrent$().subscribe((current) => {
      this.current = current;
      this.maxPosition = Math.round(current?.track?.info?.duration / 1000);

      console.log(this.maxPosition);
    });

    this.guildContentService.getRepeatMode$().subscribe((repeatMode) => {
      console.log('Dentro do footerrrrrrrrrrr', repeatMode)
      this.repeatMode = repeatMode;
    })

   

    this.guildContentService.getGuild$().subscribe((guild) => {
      this.guildID = guild.id;
    });
  }

  ngOnInit() {
    this.playerService
      .getPlaybackPosition$()
      .pipe(throttleTime(1000))
      .subscribe((newPosition) => {
        this.position = Math.round(newPosition / 1000);
        this.cdr.detectChanges();
      });

       this.guildContentService.getPlaying$().subscribe((playing) => {
      this.playing = playing
      this.cdr.detectChanges();
    })
  }

  ngAfterViewInit() {}

  skipTrack() {
    this.playerService.skipTrack(this.guildID);
  }

  backTrack() {
    this.playerService.backTrack(this.guildID);
  }

  shuffle() {
    this.playerService.shuffle(this.guildID);
  }

  loop() {
    this.playerService.loop(this.guildID, this.repeatMode);
  }

  togglePlay() {
    this.playerService.togglePlay(this.guildID);
  }
}
