import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-guild-queue-track-icon',
  standalone: true,
  imports: [],
  templateUrl: './guild-queue-track-icon.component.html',
  styleUrl: './guild-queue-track-icon.component.scss'
})
export class GuildQueueTrackIconComponent {
  @Input() trackInfo: any;
  
}
