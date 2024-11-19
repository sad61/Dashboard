import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuildContentComponent } from './guild-content.component';

describe('GuildContentComponent', () => {
  let component: GuildContentComponent;
  let fixture: ComponentFixture<GuildContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuildContentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GuildContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
