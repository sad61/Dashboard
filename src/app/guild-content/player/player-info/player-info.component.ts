import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { GeneralService } from '../../../general.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlayerService } from '../services/player.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-player-info',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './player-info.component.html',
  styleUrl: './player-info.component.scss',
})
export class PlayerInfoComponent {
  @Input() track!: any;
  @Input() guildID!: string;
  @Input() source!: string;
  user!: any;

  private IFrame!: any;
  private EmbedController!: any;
  private Player!: any;

  private destroy$ = new Subject<void>();

  private synchronizing!: boolean;

  constructor(
    private generalService: GeneralService,
    private playerService: PlayerService
  ) {
    this.generalService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.user = user;
      });

    this.playerService
      .getIFrame$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((IFrame) => {
        this.IFrame = IFrame;
      });

    this.playerService
      .getEmbedController$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((EmbedController: any) => {
        this.EmbedController = EmbedController;
      });

    this.playerService
      .getPlayer$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((Player) => {
        this.Player = Player;
      });

    this.playerService
      .getSource$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((Player) => {
        this.Player = Player;
      });

      this.playerService
      .getSynchronizing$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((synch) => {
        this.synchronizing = synch;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  synchronizePlayer() {
    this.playerService.getPlayerTime(this.guildID).subscribe({
      next: (data) => {
        switch (this.source) {
          case 'youtube':
            this.Player.seekTo(Math.round(data.time / 1000) - 0.5, true);
            this.playerService.updateSynchronizing$(true)
            break;

          case 'spotify':
            console.log
            this.EmbedController.seek(Math.round(data.time / 1000) - .5);
            break;
        }
      },
    });
  }
}
