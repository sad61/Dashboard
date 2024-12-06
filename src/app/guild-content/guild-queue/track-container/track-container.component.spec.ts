import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackContainerComponent } from './track-container.component';

describe('TrackContainerComponent', () => {
  let component: TrackContainerComponent;
  let fixture: ComponentFixture<TrackContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackContainerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TrackContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
