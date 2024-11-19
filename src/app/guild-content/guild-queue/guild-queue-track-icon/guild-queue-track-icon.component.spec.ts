import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuildQueueTrackIconComponent } from './guild-queue-track-icon.component';

describe('GuildQueueTrackIconComponent', () => {
  let component: GuildQueueTrackIconComponent;
  let fixture: ComponentFixture<GuildQueueTrackIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuildQueueTrackIconComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GuildQueueTrackIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
