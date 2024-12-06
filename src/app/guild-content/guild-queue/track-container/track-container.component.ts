import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-track-container',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './track-container.component.html',
  styleUrl: './track-container.component.scss'
})
export class TrackContainerComponent {
  @Input() track!: any;
  @Input() disableHoverEffects = false;
}
