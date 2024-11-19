import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuildQueueComponent } from './guild-queue.component';

describe('GuildQueueComponent', () => {
  let component: GuildQueueComponent;
  let fixture: ComponentFixture<GuildQueueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuildQueueComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GuildQueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
